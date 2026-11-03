#!/usr/bin/env ruby
# Re-submit ONLY rejected DartScore Pro iOS 1.1.64 after the signed build 11
# has been uploaded and processed. Never change other apps, release type or IAPs.
require 'json'
require 'openssl'
require 'base64'
require 'net/http'
require 'uri'

APP_ID = '6817341039'
VERSION = '1.1.64'
BUILD = '11'
VERSION_ID = '8a31c244-d991-4f4e-b8f2-88fff839fa88'
SUBMISSION_ID = '1403ccf3-3776-49cc-931c-671f2006b90e'
ITEM_ID = 'MTQwM2NjZjMtMzc3Ni00OWNjLTkzMWMtNjcxZjIwMDZiOTBlfDZ8ODk0MjA3NzU1'

def base64url(s)
  Base64.urlsafe_encode64(s, padding: false)
end

def token
  key = OpenSSL::PKey.read(File.read(ENV.fetch('APPSTORE_KEY_PATH')))
  now = Time.now.to_i
  header = base64url(JSON.generate(alg:'ES256',kid:ENV.fetch('APPSTORE_KEY_ID'),typ:'JWT'))
  payload = base64url(JSON.generate(iss:ENV.fetch('APPSTORE_ISSUER_ID'),aud:'appstoreconnect-v1',iat:now,exp:now+1100))
  message = "#{header}.#{payload}"
  der = OpenSSL::ASN1.decode(key.sign(OpenSSL::Digest.new('SHA256'),message))
  sig = der.value.map{|part|part.value.to_s(2).rjust(32,"\x00")}.join
  "#{message}.#{base64url(sig)}"
end

def request(method,path,body=nil,params={})
  uri = URI('https://api.appstoreconnect.apple.com'+path)
  uri.query=URI.encode_www_form(params) unless params.empty?
  request = case method
    when :get then Net::HTTP::Get.new(uri)
    when :patch then Net::HTTP::Patch.new(uri)
    else raise "Unsafe method #{method}"
  end
  request['Authorization'] = "Bearer #{token}"
  if body
    request['Content-Type']='application/json'
    request.body=JSON.generate(body)
  end
  response=Net::HTTP.start(uri.host,uri.port,use_ssl:true,open_timeout:20,read_timeout:40){|http|http.request(request)}
  parsed=JSON.parse(response.body.to_s.empty? ? '{}' : response.body) rescue {}
  status=response.code.to_i
  return parsed if (200..299).cover?(status)
  errors=parsed.fetch('errors',[]).map{|e|{"code"=>e['code'],"detail"=>e['detail'].to_s[0,300]}}
  raise "#{method.upcase} #{path} HTTP #{status}: #{errors}"
end

def version
  response=request(:get,"/v1/apps/#{APP_ID}/appStoreVersions",nil,{'limit'=>100,'include'=>'build'})
  versions=response.fetch('data',[]).select{|v|v.dig('attributes','versionString')==VERSION && v.dig('attributes','platform')=='IOS'}
  raise "Version #{VERSION} not unique (#{versions.size})" unless versions.size==1
  v=versions.first
  raise "Unexpected App Store version ID" unless v['id']==VERSION_ID
  v
end

def rejected_item
  response=request(:get,"/v1/reviewSubmissions/#{SUBMISSION_ID}/items",nil,{'include'=>'appStoreVersion','limit'=>100})
  items=response.fetch('data',[])
  raise "Unexpected review item count #{items.size}" unless items.size==1
  item=items.first
  raise "Unexpected review item ID" unless item['id']==ITEM_ID
  raise "Wrong review item target" unless item.dig('relationships','appStoreVersion','data','id')==VERSION_ID
  item
end

app=request(:get,"/v1/apps/#{APP_ID}")
raise 'Wrong App Store app' unless app.dig('data','id')==APP_ID

current=version
raise "Expected MANUAL release, got #{current.dig('attributes','releaseType')}" unless current.dig('attributes','releaseType')=='MANUAL'
raise "Unexpected initial state #{current.dig('attributes','appStoreState')}" unless %w[REJECTED READY_FOR_REVIEW].include?(current.dig('attributes','appStoreState'))
puts "VERIFIED: #{VERSION} state=#{current.dig('attributes','appStoreState')} release=MANUAL"

submission=request(:get,"/v1/reviewSubmissions/#{SUBMISSION_ID}")['data']
raise "Wrong review submission" unless submission['id']==SUBMISSION_ID
raise "Unexpected review state #{submission.dig('attributes','state')}" unless %w[UNRESOLVED_ISSUES READY_FOR_REVIEW].include?(submission.dig('attributes','state'))
item=rejected_item
raise "Unexpected review item state #{item.dig('attributes','state')}" unless %w[REJECTED READY_FOR_REVIEW].include?(item.dig('attributes','state'))

# Apple may take time to process a validated upload.
selected=nil
120.times do |attempt|
  builds=request(:get,'/v1/builds',nil,{'filter[app]'=>APP_ID,'include'=>'preReleaseVersion','limit'=>200})
  selected=builds.fetch('data',[]).find do |b|
    next false unless b.dig('attributes','version').to_s==BUILD
    preid=b.dig('relationships','preReleaseVersion','data','id')
    release=builds.fetch('included',[]).find{|x|x['type']=='preReleaseVersions' && x['id']==preid}
    release&.dig('attributes','version')==VERSION
  end
  state=selected&.dig('attributes','processingState')
  raise "Build #{VERSION} (#{BUILD}) INVALID: #{state}" if %w[FAILED INVALID].include?(state)
  if selected && state=='VALID'
    puts "VERIFIED: uploaded build #{VERSION} (#{BUILD}) is VALID"
    break
  end
  puts "Build #{VERSION} (#{BUILD}) processing: #{state||'not listed'} (#{attempt+1}/120)"
  sleep(20) if attempt<119
end
raise 'Build 11 is not processed; no review changes were made' unless selected && selected.dig('attributes','processingState')=='VALID'
build_id=selected.fetch('id')

unless current.dig('relationships','build','data','id')==build_id
  request(:patch,"/v1/appStoreVersions/#{VERSION_ID}/relationships/build",
    {data:{type:'builds',id:build_id}})
  puts 'ATTACHED: build 11 to iOS version 1.1.64'
end
raise 'Version build association not confirmed' unless version.dig('relationships','build','data','id')==build_id
raise 'Release type changed unexpectedly' unless version.dig('attributes','releaseType')=='MANUAL'

# Existing rejected item must be marked resolved; a new submission must NOT
# be created, because this submission already contains the rejected version.
item=rejected_item
if item.dig('attributes','state')=='REJECTED'
  request(:patch,"/v1/reviewSubmissionItems/#{ITEM_ID}",{
    data:{type:'reviewSubmissionItems',id:ITEM_ID,attributes:{resolved:true}}
  })
  puts 'RESOLVED: old app-version rejection after attaching corrected build'
end
new_item=rejected_item
raise "Review item not ready (#{new_item.dig('attributes','state')})" unless new_item.dig('attributes','state')=='READY_FOR_REVIEW'

submission=request(:get,"/v1/reviewSubmissions/#{SUBMISSION_ID}")['data']
raise "Submission not resubmittable: #{submission.dig('attributes','state')}" unless %w[UNRESOLVED_ISSUES READY_FOR_REVIEW].include?(submission.dig('attributes','state'))
request(:patch,"/v1/reviewSubmissions/#{SUBMISSION_ID}",{
  data:{type:'reviewSubmissions',id:SUBMISSION_ID,attributes:{submitted:true}}
})
puts 'SUBMITTED: corrected iOS version 1.1.64 (11) to Apple App Review'

# Read the server state, not only the write response.
12.times do |attempt|
  post=request(:get,"/v1/reviewSubmissions/#{SUBMISSION_ID}")['data']
  current_state=post.dig('attributes','state')
  puts "Apple submission state: #{current_state}"
  if %w[WAITING_FOR_REVIEW IN_REVIEW].include?(current_state)
    puts "SUCCESS: App Store review submission confirmed state=#{current_state} version=#{VERSION} build=#{BUILD}"
    exit 0
  end
  raise "Apple review submission rejected: #{current_state}" if %w[UNRESOLVED_ISSUES CANCELING COMPLETE].include?(current_state) && attempt>1
  sleep(10) if attempt<11
end
raise 'Review write accepted but final server state not confirmed; check App Store Connect'
