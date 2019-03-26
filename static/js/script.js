/***************************************************
 * 다음 지도 API 관련 로직
 */
var mapContainer = document.getElementById('map'), // 지도를 표시할 div 
mapOption = {
  center: new daum.maps.LatLng(37.566826, 126.9786567), // 지도의 중심좌표
  level: 3 // 지도의 확대 레벨
};

// 지도를 생성    
var map = new daum.maps.Map(mapContainer, mapOption);

// 주소-좌표 변환 객체를 생성
var geocoder = new daum.maps.services.Geocoder();

/**
 * 현재 위치에 위도, 경도를 받아서 주소를 추출하고 지도를 현재 위치로 이동시킴
 * @param {*} latitude 위도
 * @param {*} longitude 경도
 */
function my_location_find(latitude, longitude) {
  var latlng = new daum.maps.LatLng(latitude, longitude);
  searchAddrFromCoords(latlng, function(result, status) {
    if (status === daum.maps.services.Status.OK) {
      console.log(result[0].address_name); // 읍,면,동까지의 주소
      map.setCenter(new daum.maps.LatLng(latitude, longitude)); // 현재 위치로 지도 이동
    }   
  });
}

function searchAddrFromCoords(coords, callback) {
  // 좌표로 행정동 주소 정보를 요청합니다
  geocoder.coord2RegionCode(coords.getLng(), coords.getLat(), callback);         
}

$(function() {

  // 현재 위치에 위도, 경도를 가져오는 로직
  navigator.geolocation.getCurrentPosition(function(position) {
    console.log(position.coords.latitude, position.coords.longitude);
    my_location_find(position.coords.latitude, position.coords.longitude);
  });
});

// 마우스 휠과 모바일 터치를 이용한 지도 확대, 축소를 막는다
map.setZoomable(false);   

// ctrl키를 누를때
$(document).keydown(function(e) {
  if(e.keyCode == 17) {
    map.setZoomable(true);  
  } 
})
// ctrl키를 땔때
$(document).keyup(function(e) {
    map.setZoomable(false);
})
