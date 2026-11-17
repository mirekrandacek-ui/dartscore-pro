import Foundation

// Only coarse game usage; never forward arbitrary JavaScript data or purchase identifiers.
enum FirebaseEventPolicy {
    static func parameters(event: String, values: [String: Any]) -> [String: Any]? {
        guard ["game_started", "game_completed", "game_abandoned", "screen_view"].contains(event) else { return nil }
        let allowed: [String: Set<String>] = [
            "game_type": ["classic", "cricket", "around", "roulette", "killer", "shanghai", "halve", "halveit", "baseball"],
            "player_mode": ["individual", "team", "individuals", "teams"],
            "is_resume": ["0", "1"],
            "abandon_reason": ["new_game", "mode_change", "restart", "return_to_lobby"],
            "screen_name": ["lobby", "game", "statistics", "privacy"]
        ]
        var result: [String: Any] = [:]
        for (key, choices) in allowed {
            if let value = values[key] as? String, choices.contains(value) { result[key] = value }
        }
        return result
    }
}
