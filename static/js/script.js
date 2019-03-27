/***************************************************
 * 다음 지도 API 관련 로직
 */
var mapContainer = document.getElementById('map'), // 지도를 표시할 div 
    mapOption = {
        center: new daum.maps.LatLng(37.566826, 126.9786567), // 지도의 중심좌표
        level: 7 // 지도의 확대 레벨
    };

// 지도를 생성    
var map = new daum.maps.Map(mapContainer, mapOption);

// 일반 지도와 스카이뷰로 지도 타입을 전환할 수 있는 지도타입 컨트롤을 생성합니다
var mapTypeControl = new daum.maps.MapTypeControl();

// 지도에 컨트롤을 추가해야 지도위에 표시됩니다
// daum.maps.ControlPosition은 컨트롤이 표시될 위치를 정의하는데 TOPRIGHT는 오른쪽 위를 의미합니다
map.addControl(mapTypeControl, daum.maps.ControlPosition.TOPRIGHT);

// 지도 확대 축소를 제어할 수 있는  줌 컨트롤을 생성합니다
var zoomControl = new daum.maps.ZoomControl();
map.addControl(zoomControl, daum.maps.ControlPosition.RIGHT);
map.setZoomable(false);

// 주소-좌표 변환 객체를 생성
var geocoder = new daum.maps.services.Geocoder();

// 마커를 담을 배열입니다
var markers = [];

// 장소 검색 객체를 생성합니다
var ps = new daum.maps.services.Places();

// 검색 결과 목록이나 마커를 클릭했을 때 장소명을 표출할 인포윈도우를 생성합니다
var infowindow = new daum.maps.InfoWindow({ zIndex: 1 });

/**
 * 현재 위치에 위도, 경도를 받아서 주소를 추출하고 지도를 현재 위치로 이동시킴
 * @param {Number} latitude 위도
 * @param {Number} longitude 경도
 */
function my_location_find(latitude, longitude) {

    var latlng = new daum.maps.LatLng(latitude, longitude);
    searchAddrFromCoords(latlng, function (result, status) {
        if (status === daum.maps.services.Status.OK) {
            console.log(result[0].address_name); // 읍,면,동까지의 주소
            map.setCenter(new daum.maps.LatLng(latitude, longitude)); // 현재 위치로 지도 이동
        }
    });

    var latlng = new daum.maps.LatLng(latitude, longitude);
    searchAddrFromCoords(latlng, function (result, status) {
        if (status === daum.maps.services.Status.OK) {
            console.log(result[0].address_name); // 읍,면,동까지의 주소
            map.setCenter(new daum.maps.LatLng(latitude, longitude)); // 현재 위치로 지도 이동
            map.setLevel(3);
        }
    });
}

// 키워드 검색을 요청하는 함수
function searchPlaces() {
    var keyword = document.getElementById('keyword').value;
    if (!keyword.replace(/^\s+|\s+$/g, '')) {
        alert('키워드를 입력해주세요!');
        return false;
    }
    // 장소검색 객체를 통해 키워드로 장소검색을 요청
    ps.keywordSearch(keyword, placesSearchCB);
}

// 장소검색이 완료됐을 때 호출되는 콜백함수 입니다
function placesSearchCB(data, status, pagination) {
    if (status === daum.maps.services.Status.OK) {
        // 정상적으로 검색이 완료됐으면
        // 검색 목록과 마커를 표출합니다
        displayPlaces(data);

        // 페이지 번호를 표출합니다
        displayPagination(pagination);
    } else if (status === daum.maps.services.Status.ZERO_RESULT) {
        alert('검색 결과가 존재하지 않습니다.');
        return;
    } else if (status === daum.maps.services.Status.ERROR) {
        alert('검색 결과 중 오류가 발생했습니다.');
        return;
    }
}

// 검색 결과 목록과 마커를 표출하는 함수입니다
function displayPlaces(places) {
    var listEl = document.getElementById('placesList'),
        menuEl = document.getElementById('menu_wrap'),
        fragment = document.createDocumentFragment(),
        bounds = new daum.maps.LatLngBounds(),
        listStr = '';

    // 검색 결과 목록에 추가된 항목들을 제거합니다
    removeAllChildNods(listEl);
    // 지도에 표시되고 있는 마커를 제거합니다
    removeMarker();

    for (var i = 0; i < places.length; i++) {
        // 마커를 생성하고 지도에 표시합니다
        var placePosition = new daum.maps.LatLng(places[i].y, places[i].x),
            marker = addMarker(placePosition, i),
            itemEl = getListItem(i, places[i]); // 검색 결과 항목 Element를 생성합니다
        // 검색된 장소 위치를 기준으로 지도 범위를 재설정하기위해
        // LatLngBounds 객체에 좌표를 추가합니다
        bounds.extend(placePosition);

        // 마커와 검색결과 항목에 mouseover 했을때
        // 해당 장소에 인포윈도우에 장소명을 표시합니다
        // mouseout 했을 때는 인포윈도우를 닫습니다
        (function (marker, place) {
            daum.maps.event.addListener(marker, 'mouseover', function () {
                displayInfowindow(marker, place.place_name);
            });
            daum.maps.event.addListener(marker, 'mouseout', function () {
                infowindow.close();
            });
            daum.maps.event.addListener(marker, 'click', function () {
                var query = '?';
                for (var key in place) {
                    query = query + key + '=' + place[key] + '&';
                }
                location.href = "detail.html" + query;
            });
            itemEl.onmouseover = function () {
                displayInfowindow(marker, place);
            };
            itemEl.onmouseout = function () {
                infowindow.close();
            };
        })(marker, places[i]);
        // })(marker, places[i].place_name);

        fragment.appendChild(itemEl);
    }

    // 검색결과 항목들을 검색결과 목록 Elemnet에 추가합니다
    listEl.appendChild(fragment);
    menuEl.scrollTop = 0;

    // 검색된 장소 위치를 기준으로 지도 범위를 재설정합니다
    map.setBounds(bounds);
}

function searchAddrFromCoords(coords, callback) {
    // 좌표로 행정동 주소 정보를 요청합니다
    geocoder.coord2RegionCode(coords.getLng(), coords.getLat(), callback);
}

// 검색결과 항목을 Element로 반환하는 함수입니다
function getListItem(index, places) {
    var el = document.createElement('li'),
        itemStr =
            '<span class="markerbg marker_' + (index + 1) + '"></span>' +
            '<div class="info">' +
            '<h5>' + places.place_name + '</h5>';

    if (places.road_address_name) {
        itemStr += '<span>' + places.road_address_name + '</span>' +
            '<span class="jibun gray">' + places.address_name + '</span>';
    } else {
        itemStr += '<span>' + places.address_name + '</span>';
    }

    itemStr += '<span class="tel">' + places.phone + '</span>' +
        '</div>';
    el.innerHTML = itemStr;
    el.className = 'item';

    return el;
}

// 마커를 생성하고 지도 위에 마커를 표시하는 함수입니다
function addMarker(position, idx, title) {
    var imageSrc = 'http://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_number_blue.png', // 마커 이미지 url, 스프라이트 이미지를 씁니다
        imageSize = new daum.maps.Size(36, 37),  // 마커 이미지의 크기
        imgOptions = {
            spriteSize: new daum.maps.Size(36, 691), // 스프라이트 이미지의 크기
            spriteOrigin: new daum.maps.Point(0, (idx * 46) + 10), // 스프라이트 이미지 중 사용할 영역의 좌상단 좌표
            offset: new daum.maps.Point(13, 37) // 마커 좌표에 일치시킬 이미지 내에서의 좌표
        },
        markerImage = new daum.maps.MarkerImage(imageSrc, imageSize, imgOptions),
        marker = new daum.maps.Marker({
            position: position, // 마커의 위치
            image: markerImage
        });

    marker.setMap(map); // 지도 위에 마커를 표출합니다
    markers.push(marker);  // 배열에 생성된 마커를 추가합니다

    return marker;
}

// 지도 위에 표시되고 있는 마커를 모두 제거합니다
function removeMarker() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}

// 검색결과 목록 하단에 페이지번호를 표시는 함수입니다
function displayPagination(pagination) {
    var paginationEl = document.getElementById('pagination'),
        fragment = document.createDocumentFragment(),
        i;

    // 기존에 추가된 페이지번호를 삭제합니다
    while (paginationEl.hasChildNodes()) {
        paginationEl.removeChild(paginationEl.lastChild);
    }

    for (i = 1; i <= pagination.last; i++) {
        var el = document.createElement('a');
        el.href = "#";
        el.innerHTML = i;

        if (i === pagination.current) {
            el.className = 'on';
        } else {
            el.onclick = (function (i) {
                return function () {
                    pagination.gotoPage(i);
                }
            })(i);
        }

        fragment.appendChild(el);
    }
    paginationEl.appendChild(fragment);
}

// 검색결과 목록 또는 마커를 클릭했을 때 호출되는 함수입니다
// 인포윈도우에 장소명을 표시합니다
function displayInfowindow(marker, title) {
    var content = '<div style="padding:5px;z-index:1;">' + title + '</div>';

    infowindow.setContent(content);
    infowindow.open(map, marker);
}

// 검색결과 목록의 자식 Element를 제거하는 함수입니다
function removeAllChildNods(el) {
    while (el.hasChildNodes()) {
        el.removeChild(el.lastChild);
    }
}

// 우편번호 찾기 찾기 화면을 넣을 element
var element_wrap = document.getElementById('wrap');

function foldDaumPostcode() {
    // iframe을 넣은 element를 안보이게 한다.
    element_wrap.style.display = 'none';
}

function sample3_execDaumPostcode() {
    // 현재 scroll 위치를 저장해놓는다.
    var currentScroll = Math.max(document.body.scrollTop, document.documentElement.scrollTop);
    new daum.Postcode({
        oncomplete: function (data) {
            var addr = data.sido + " " + data.sigungu + " " + data.bname; // 주소 변수
            $(".form_location").val(addr);
            $(".address_tracking").hide();
        },
        // 우편번호 찾기 화면 크기가 조정되었을때 실행할 코드를 작성하는 부분. iframe을 넣은 element의 높이값을 조정한다.
        onresize: function (size) {
            element_wrap.style.height = size.height + 'px';
        },
        width: '340px',
        height: '100%'
    }).embed(element_wrap);

    // iframe을 넣은 element를 보이게 한다.
    element_wrap.style.display = 'block';
}

// 추가한거
$(function () {
    $(document).keydown(function (e) {
        // ctrl 누를때 확대 축소기능 열기
        if (e.keyCode == 17) {
            map.setZoomable(true);
        }
    })
    // ctrl키를 땔때
    $(document).keyup(function (e) {
        map.setZoomable(false);
    })

    var timeout;
    $(".map_wrap").on("mousewheel DOMMouseScroll", function (e) {

        e.preventDefault();

        // ctrl누를때 text_p 나오게하기
        if (e.ctrlKey == false) {
            // document.getElementById("overlay").style.display = "block";
            $("#overlay").fadeIn("slow");
            // 1초뒤에 text_p 사라지게 하기

            clearTimeout(timeout); // 초기화시켜서 반복안되게하기
            timeout = setTimeout(function () {
                $("#overlay").fadeOut("slow");
                // document.getElementById("overlay").style.display = "none";
            }, 1000);
        }
    });



    // 현재 위치에 위도, 경도를 가져오는 로직
    navigator.geolocation.getCurrentPosition(function (position) {
        console.log(position.coords.latitude, position.coords.longitude);
        my_location_find(position.coords.latitude, position.coords.longitude);
    });
});
