#!/usr/bin/env ruby
# Read-only App Store Connect release preflight. No upload and no writes.
require 'json'
require 'openssl'
require 'base64'
require 'net/http'
require 'uri'

APP_ID = '6817341039'
def b64(v); Base64.urlsafe_encode64(v, padding: false); end
def token
  key=OpenSSL::PKey.read(File.read(ENV.fetch('APPSTORE_KEY_PATH')))
  now=Time.now.to_i
  h=b64(JSON.generate(alg:'ES256',kid:ENV.fetch('APPSTORE_KEY_ID'),typ:'JWT'))
  p=b64(JSON.generate(iss:ENV.fetch('APPSTORE_ISSUER_ID'),aud:'appstoreconnect-v1',iat:now,exp:now+1000))
  msg="#{h}.#{p}"
  der=OpenSSL::ASN1.decode(key.sign(OpenSSL::Digest.new('SHA256'),msg))
  sig=der.value.map{|c|c.value.to_s(2).rjust(32,"\x00")}.join
  "#{msg}.#{b64(sig)}"
end
def get(path,params={})
  url=URI('https://api.appstoreconnect.apple.com'+path)
  url.query=URI.encode_www_form(params) unless params.empty?
  req=Net::HTTP::Get.new(url)
  req['Authorization']="Bearer #{@token}"
  res=Net::HTTP.start(url.host,url.port,use_ssl:true,open_timeout:20,read_timeout:40){|h|h.request(req)}
  begin
    body=JSON.parse(res.body.to_s)
  rescue
    body={}
  end
  errors=body.fetch('errors',[]).map{|e|{'code'=>e['code'],'detail'=>e['detail'].to_s[0,200]}}
  raise "GET #{path} HTTP #{res.code}: #{errors}" unless res.code.to_i==200
  body
end
@token=token
app=get("/v1/apps/#{APP_ID}")
raise 'App identifier does not match' unless app.dig('data','id')==APP_ID
puts "Verified App Store Connect app ID #{APP_ID}"
v=get("/v1/apps/#{APP_ID}/appStoreVersions",{'limit'=>100,'include'=>'build'})
versions=v.fetch('data',[]).select{|item|item.dig('attributes','platform')=='IOS'}
versions.sort_by!{|item|item.dig('attributes','createdDate').to_s}
versions.each do |ver|
  a=ver['attributes']||{}
  puts "VERSION #{a['versionString']} status=#{a['appStoreState']||a['appVersionState']} releaseType=#{a['releaseType']} versionId=#{ver['id']} attachedBuildId=#{ver.dig('relationships','build','data','id')}"
end
b=get('/v1/builds',{'filter[app]'=>APP_ID,'limit'=>100})
last=b.fetch('data',[]).select{|item|%w[10 11].include?(item.dig('attributes','version'))}
last.each do |item|
 a=item['attributes']||{}
 puts "BUILD #{a['version']} id=#{item['id']} process=#{a['processingState']} uploaded=#{a['uploadedDate']}"
end
begin
 r=get("/v1/apps/#{APP_ID}/reviewSubmissions",{'limit'=>100})
 r.fetch('data',[]).each{|sub|a=sub['attributes']||{}; puts "REVIEW_SUBMISSION id=#{sub['id']} state=#{a['state']} platform=#{a['platform']} submittedDate=#{a['submittedDate']}"}
rescue => e
 puts "REVIEW_SUBMISSIONS_UNAVAILABLE #{e.message}"
end
raise 'Expected App Store version 1.1.64 was not found' unless versions.any?{|ver|ver.dig('attributes','versionString')=='1.1.64'}
puts 'READONLY_PREFLIGHT=SUCCESS'
