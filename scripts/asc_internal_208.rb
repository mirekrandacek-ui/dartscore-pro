#!/usr/bin/env ruby
# Only the existing DartScore Internal group; no reviewer submissions or invites.
require 'json'
require 'openssl'
require 'base64'
require 'net/http'
require 'uri'
APP_ID='6817341039'
VERSION='2.08'
BUILD='12'
GROUP='DartScore Internal'
def b64(s); Base64.urlsafe_encode64(s,padding:false); end
def token
  now=Time.now.to_i
  h=b64(JSON.generate(alg:'ES256',kid:ENV.fetch('APPSTORE_KEY_ID'),typ:'JWT'))
  p=b64(JSON.generate(iss:ENV.fetch('APPSTORE_ISSUER_ID'),aud:'appstoreconnect-v1',iat:now,exp:now+1000))
  msg="#{h}.#{p}"
  key=OpenSSL::PKey.read(File.read(ENV.fetch('APPSTORE_KEY_PATH')))
  parts=OpenSSL::ASN1.decode(key.sign(OpenSSL::Digest.new('SHA256'),msg)).value
  sig=parts.map{|x|x.value.to_s(2).rjust(32,"\x00")}.join
  raise 'Invalid ES256 signature' unless sig.bytesize==64
  "#{msg}.#{b64(sig)}"
end
def request(method,path,params={},body=nil)
  raise 'Unsafe method' unless [:get,:post].include?(method)
  raise 'Unsafe write route' if method==:post && !path.match?(%r{\A/v1/betaGroups/[^/]+/relationships/builds\z})
  uri=URI('https://api.appstoreconnect.apple.com'+path)
  uri.query=URI.encode_www_form(params) unless params.empty?
  req=method==:get ? Net::HTTP::Get.new(uri) : Net::HTTP::Post.new(uri)
  req['Authorization']="Bearer #{token}"
  if body; req['Content-Type']='application/json';req.body=JSON.generate(body);end
  res=Net::HTTP.start(uri.host,uri.port,use_ssl:true,open_timeout:20,read_timeout:40){|http|http.request(req)}
  data=res.body.to_s.empty? ? {} : JSON.parse(res.body)
  raise "#{method} #{path} HTTP #{res.code}: #{data.fetch('errors',[]).map{|e|e['detail']}.join('; ')}" unless (200..299).cover?(res.code.to_i)
  data
end
def builds
  request(:get,'/v1/builds',{'filter[app]'=>APP_ID,'filter[version]'=>BUILD,'include'=>'preReleaseVersion','limit'=>200})
end
def selected_build(data)
  data.fetch('data',[]).find do |b|
    release_id=b.dig('relationships','preReleaseVersion','data','id')
    release=data.fetch('included',[]).find{|r|r['type']=='preReleaseVersions' && r['id']==release_id}
    b.dig('attributes','version').to_s==BUILD && release&.dig('attributes','version')==VERSION
  end
end
def existing_group
  data=request(:get,'/v1/betaGroups',{'filter[app]'=>APP_ID,'filter[name]'=>GROUP,'limit'=>100})
  groups=data.fetch('data',[]).select{|g|g.dig('attributes','name')==GROUP && g.dig('attributes','isInternalGroup')==true}
  raise 'Expected exactly one existing internal group' unless groups.length==1
  groups.first
end
mode=ARGV.fetch(0,'preflight')
raise 'Unknown mode' unless ['preflight','assign','status'].include?(mode)
app=request(:get,"/v1/apps/#{APP_ID}")
raise 'Wrong application' unless app.dig('data','id')==APP_ID && app.dig('data','attributes','bundleId')=='com.randis2288.dartscorepro'
group=existing_group
puts "Verified app #{APP_ID}, existing INTERNAL group #{GROUP}"
if mode=='preflight'
  raise "#{VERSION} (#{BUILD}) already exists; do not upload a duplicate" if selected_build(builds)
  uploads=request(:get,"/v1/apps/#{APP_ID}/buildUploads",{'limit'=>100,'sort'=>'-uploadedDate'})
  duplicate=uploads.fetch('data',[]).find{|u|u.dig('attributes','cfBundleShortVersionString')==VERSION && u.dig('attributes','cfBundleVersion').to_s==BUILD}
  raise "#{VERSION} (#{BUILD}) already has an upload record; inspect before retrying" if duplicate
  versions=request(:get,"/v1/apps/#{APP_ID}/appStoreVersions",{'limit'=>100})
  puts JSON.generate(versions:versions.fetch('data',[]).map{|v|v.fetch('attributes',{}).slice('versionString','appStoreState','releaseType')})
  puts "PREFLIGHT=SUCCESS: #{VERSION} (#{BUILD}) is free; no changes made"
  exit
end
build=nil
(mode=='assign' ? 36 : 1).times do |attempt|
  build=selected_build(builds)
  state=build&.dig('attributes','processingState')
  raise "Apple processing failed: #{state}" if ['FAILED','INVALID'].include?(state)
  break if state=='VALID'
  puts "Waiting for #{VERSION} (#{BUILD}): #{state||'not yet listed'} (#{attempt+1}/36)"
  sleep(20) if mode=='assign' && attempt<35
end
raise 'Build is not VALID; do not re-upload blindly' unless build&.dig('attributes','processingState')=='VALID'
id=build.fetch('id')
if mode=='assign' && group.dig('attributes','hasAccessToAllBuilds')!=true
  linked=request(:get,"/v1/betaGroups/#{group['id']}/relationships/builds",{'limit'=>200})
  unless linked.fetch('data',[]).any?{|b|b['id']==id}
    request(:post,"/v1/betaGroups/#{group['id']}/relationships/builds",{},{data:[{type:'builds',id:id}]})
  end
end
confirmed=false
12.times do |attempt|
  linked=request(:get,"/v1/betaGroups/#{group['id']}/relationships/builds",{'limit'=>200})
  confirmed=linked.fetch('data',[]).any?{|b|b['id']==id}
  break if confirmed || mode=='status'
  puts "Waiting for internal group relationship (#{attempt+1}/12)"
  sleep(20) if attempt<11
end
raise 'Build not confirmed in existing internal group' unless confirmed
result={appId:APP_ID,version:VERSION,build:BUILD,buildId:id,processingState:'VALID',internalGroup:GROUP,internalGroupConfirmed:true,appReviewSubmitted:false}
File.write('build/evidence/testflight-result.json',JSON.pretty_generate(result))
puts JSON.generate(result)
puts "SUCCESS: #{VERSION} (#{BUILD}) available in #{GROUP}"
