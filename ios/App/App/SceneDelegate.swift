import UIKit
import Capacitor
import AVFoundation
import StoreKit

@objc(DartScoreIOSPlugin)
public class DartScoreIOSPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "DartScoreIOSPlugin"
    public let jsName = "DartScoreIOS"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "speak", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openReview", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "shareApp", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getPremiumProduct", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchasePremium", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restorePremium", returnType: CAPPluginReturnPromise)
    ]

    private let synthesizer = AVSpeechSynthesizer()

    @objc func speak(_ call: CAPPluginCall) {
        let text = call.getString("text") ?? ""
        let lang = call.getString("lang") ?? "en-US"

        guard !text.isEmpty else {
            call.resolve()
            return
        }

        DispatchQueue.main.async {
            self.synthesizer.stopSpeaking(at: .immediate)
            let utterance = AVSpeechUtterance(string: text)
            utterance.voice = AVSpeechSynthesisVoice(language: lang)
            utterance.rate = AVSpeechUtteranceDefaultSpeechRate
            self.synthesizer.speak(utterance)
            call.resolve()
        }
    }

    @objc func openReview(_ call: CAPPluginCall) {
        let appId = call.getString("appId") ?? ""
        guard !appId.isEmpty,
              let url = URL(string: "https://apps.apple.com/app/id\(appId)?action=write-review") else {
            call.reject("Missing App Store app ID")
            return
        }

        DispatchQueue.main.async {
            UIApplication.shared.open(url, options: [:]) { success in
                if success {
                    call.resolve()
                } else {
                    call.reject("Could not open App Store review page")
                }
            }
        }
    }

    @objc func shareApp(_ call: CAPPluginCall) {
        let text = call.getString("text") ?? ""
        let urlString = call.getString("url") ?? ""
        var items: [Any] = []

        if !text.isEmpty {
            items.append(text)
        }
        if let url = URL(string: urlString), !urlString.isEmpty {
            items.append(url)
        }

        guard !items.isEmpty else {
            call.reject("Nothing to share")
            return
        }

        DispatchQueue.main.async {
            guard let controller = self.bridge?.viewController else {
                call.reject("No view controller available")
                return
            }

            let activity = UIActivityViewController(activityItems: items, applicationActivities: nil)
            if let popover = activity.popoverPresentationController {
                popover.sourceView = controller.view
                popover.sourceRect = CGRect(
                    x: controller.view.bounds.midX,
                    y: controller.view.bounds.midY,
                    width: 1,
                    height: 1
                )
            }

            controller.present(activity, animated: true) {
                call.resolve()
            }
        }
    }

    @objc func getPremiumProduct(_ call: CAPPluginCall) {
        let productId = call.getString("productId") ?? "premium_unlock"

        Task {
            do {
                let products = try await Product.products(for: [productId])
                guard let product = products.first else {
                    call.resolve(["available": false])
                    return
                }

                call.resolve([
                    "available": true,
                    "displayPrice": product.displayPrice,
                    "displayName": product.displayName
                ])
            } catch {
                call.reject("Could not load Premium product: \(error.localizedDescription)")
            }
        }
    }

    @objc func purchasePremium(_ call: CAPPluginCall) {
        let productId = call.getString("productId") ?? "premium_unlock"

        Task {
            do {
                if await ownsPremium(productId: productId) {
                    call.resolve(["status": "alreadyOwned", "owned": true])
                    return
                }

                let products = try await Product.products(for: [productId])
                guard let product = products.first else {
                    call.resolve(["status": "notFound", "owned": false])
                    return
                }

                let result = try await product.purchase()

                switch result {
                case .success(let verification):
                    switch verification {
                    case .verified(let transaction):
                        await transaction.finish()
                        call.resolve(["status": "purchased", "owned": true])
                    case .unverified(_, let error):
                        call.reject("Unverified App Store transaction: \(error.localizedDescription)")
                    }
                case .userCancelled:
                    call.resolve(["status": "cancelled", "owned": false])
                case .pending:
                    call.resolve(["status": "pending", "owned": false])
                @unknown default:
                    call.resolve(["status": "unknown", "owned": false])
                }
            } catch {
                call.reject("Premium purchase failed: \(error.localizedDescription)")
            }
        }
    }

    @objc func restorePremium(_ call: CAPPluginCall) {
        let productId = call.getString("productId") ?? "premium_unlock"
        let sync = call.getBool("sync") ?? false

        Task {
            do {
                if sync {
                    try await AppStore.sync()
                }

                let owned = await ownsPremium(productId: productId)
                call.resolve(["owned": owned])
            } catch {
                call.reject("Could not restore purchases: \(error.localizedDescription)")
            }
        }
    }

    private func ownsPremium(productId: String) async -> Bool {
        for await result in Transaction.currentEntitlements {
            guard case .verified(let transaction) = result else { continue }
            if transaction.productID == productId && transaction.revocationDate == nil {
                return true
            }
        }
        return false
    }
}

class DartScoreBridgeViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(DartScoreIOSPlugin())
    }
}

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = DartScoreBridgeViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
