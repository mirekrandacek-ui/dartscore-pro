#!/usr/bin/env ruby
# Associate the newly uploaded DartScore Pro build 8 with the existing INTERNAL
# TestFlight group. Never submit for Beta App Review or public App Store review.
require 'json'
require 'openssl'
require 'base64'
require 'net/http'
require 'uri'

APP_ID = '6817341039'
BUILD_NUMBER = '8'
GROUP_NAME = 'DartScore Internal'

def base64url(bytes)
  Base64.urlsafe_encode64(bytes, padding: false)
end

def app_store_token
  key_id = ENV.fetch('APPSTORE_KEY_ID')
  issuer_id = ENV.fetch('APPSTORE_ISSUER_ID')
  key = OpenSSL::PKey.read(File.read(ENV.fetch('APPSTORE_KEY_PATH')))
  now = Time.now.to_i
  header = base64url(JSON.generate(alg: 'ES256', kid: key_id, typ: 'JWT'))
  payload = base64url(JSON.generate(iss: issuer_id, aud: 'appstoreconnect-v1', iat: now, exp: now + 1200))
  input = "#{header}.#{payload}"
  asn1 = OpenSSL::ASN1.decode(key.sign(OpenSSL::Digest.new('SHA256'), input))
  components = asn1.value.map { |part| part.value.to_s(2).rjust(32, "\x00") }
  raise 'Unexpected ES256 signature format' unless components.length == 2 && components.all? { |part| part.bytesize == 32 }
  "#{input}.#{base64url(components.join)}"
end

def request(method, route, token, body = nil, params = {})
  url = URI("https://api.appstoreconnect.apple.com#{route}")
  url.query = URI.encode_www_form(params) unless params.empty?
  req = method == :post ? Net::HTTP::Post.new(url) : Net::HTTP::Get.new(url)
  req['Authorization'] = "Bearer #{token}"
  req['Content-Type'] = 'application/json' if body
  req.body = JSON.generate(body) if body
  res = Net::HTTP.start(url.host, url.port, use_ssl: true, open_timeout: 20, read_timeout: 40) do |http|
    http.request(req)
  end
  parsed = res.body && !res.body.strip.empty? ? JSON.parse(res.body) : {}
  [res.code.to_i, parsed]
end

token = app_store_token
code, groups = request(:get, '/v1/betaGroups', token, nil,
  { 'filter[app]' => APP_ID, 'filter[name]' => GROUP_NAME, 'limit' => 100 })
raise "Could not list internal TestFlight groups (HTTP #{code})" unless code == 200
group = groups.fetch('data', []).find { |g|
  g.dig('attributes', 'name') == GROUP_NAME && g.dig('attributes', 'isInternalGroup') == true
}
raise "Existing internal TestFlight group '#{GROUP_NAME}' not found" unless group
group_id = group.fetch('id')
puts "Found existing internal TestFlight group: #{GROUP_NAME}"

# The upload may have completed while Apple still processes the build.
# Retry only for build visibility/processing; never change distribution type.
build = nil
24.times do |attempt|
  code, response = request(:get, '/v1/builds', token, nil,
    { 'filter[app]' => APP_ID, 'limit' => 200 })
  raise "Could not list builds (HTTP #{code})" unless code == 200
  candidate = response.fetch('data', []).find { |b|
    b.dig('attributes', 'version').to_s == BUILD_NUMBER
  }
  state = candidate&.dig('attributes', 'processingState')
  if candidate && state == 'VALID'
    build = candidate
    puts "Build #{BUILD_NUMBER} processed successfully (VALID)"
    break
  end
  raise "Apple rejected build #{BUILD_NUMBER} (#{state})" if %w[FAILED INVALID].include?(state)
  puts "Waiting for build #{BUILD_NUMBER} processing: #{state || 'not yet listed'} (#{attempt + 1}/24)"
  sleep(25) if attempt < 23
end
raise "Build #{BUILD_NUMBER} not yet ready for internal testing; upload may still have succeeded" unless build
build_id = build.fetch('id')

# Automatic internal groups already have access to all eligible builds.
# The ASC API rejects adding them explicitly with HTTP 422 even though
# TestFlight access can already be active. Only POST to manual groups.
automatic = group.dig('attributes', 'hasAccessToAllBuilds') == true
puts "Internal group automatic distribution: #{automatic}"

unless automatic
  body = { data: [{ type: 'builds', id: build_id }] }
  code, response = request(:post, "/v1/betaGroups/#{group_id}/relationships/builds", token, body)
  if code == 422 &&
      response.fetch('errors', []).any? { |e| e['detail'].to_s.include?('Cannot add internal group to a build') }
    puts 'Apple rejected manual linking; checking whether the build is already automatically assigned'
  elsif ![204, 409].include?(code)
    raise "Failed to add build #{BUILD_NUMBER} to internal group (HTTP #{code}): #{response.fetch('errors', []).map { |e| e['detail'] }.join('; ')}"
  end
end

# Verify the actual Apple relationship, not just a successful upload.
confirmed = false
12.times do |attempt|
  code, response = request(:get, "/v1/betaGroups/#{group_id}/relationships/builds", token, nil, { 'limit' => 200 })
  raise "Failed to verify internal group association (HTTP #{code})" unless code == 200
  if response.fetch('data', []).any? { |b| b['id'] == build_id }
    confirmed = true
    break
  end
  puts "Waiting for build #{BUILD_NUMBER} to appear in internal group (#{attempt + 1}/12)"
  sleep(20) if attempt < 11
end
raise "Build #{BUILD_NUMBER} not confirmed in internal group #{GROUP_NAME}" unless confirmed
puts "SUCCESS: DartScore Pro 1.1.63 (#{BUILD_NUMBER}) is assigned to INTERNAL TestFlight group '#{GROUP_NAME}'."
