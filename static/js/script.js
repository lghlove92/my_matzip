/***************************************************
 * 다음 지도 API 관련 로직
 */
var mapContainer = document.getElementById("map"), // 지도를 표시할 div
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
    var keyword = document.getElementById("keyword").value;
    var addrData = $(".form_location").val();
    console.log(addrData);
    if (!keyword.replace(/^\s+|\s+$/g, "")) {
        alert("키워드를 입력해주세요!");
        return false;
    }
    // 장소검색 객체를 통해 키워드로 장소검색을 요청 (검색 결과 값 넣어서 같이 검색)
    ps.keywordSearch(addrData + " " + keyword, placesSearchCB);
    3;
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
        alert("검색 결과가 존재하지 않습니다.");
        return;
    } else if (status === daum.maps.services.Status.ERROR) {
        alert("검색 결과 중 오류가 발생했습니다.");
        return;
    }
}

// 검색 결과 목록과 마커를 표출하는 함수입니다
function displayPlaces(places) {
    var listEl = document.getElementById("placesList"),
        menuEl = document.getElementById("menu_wrap"),
        fragment = document.createDocumentFragment(),
        bounds = new daum.maps.LatLngBounds(),
        listStr = "";

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
            var hover = function () {
                displayInfowindow(marker, place.place_name);
            }
            daum.maps.event.addListener(marker, 'mouseover', hover);
            daum.maps.event.addListener(marker, 'mouseout', function () {
                infowindow.close();
            });
            // 마커를 클릭했을때 닫기가 가능한 커스텀오버레이 뜨게하기
            daum.maps.event.addListener(marker, 'click', function () {
                infowindow.close();
                daum.maps.event.removeListener(marker, 'mouseover', hover);
                console.log(place);
                $(".custom_overlay_close").click();
                var content = '<div class="custom_overlay_wrap">' +
                    '    <div class="info">' +
                    '        <div class="title">' + place.place_name +
                    '            <div class="custom_overlay_close" title="닫기"></div>' +
                    '        </div>' +
                    '        <div class="body">' +
                    '            <div class="img">' +
                    '                <img src="data:image/jpeg;base64,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" width="73" height="70">' +
                    '           </div>' +
                    '            <div class="desc">' +
                    '                <div class="ellipsis">' + place.road_address_name + '</div>' +
                    '                <div class="jibun ellipsis">' + place.address_name + '</div>' +
                    '                <div>' + place.phone + '</div>' +
                    '            </div>' +
                    '        </div>' +
                    '    </div>' +
                    '</div>';

                // 마커 위에 커스텀오버레이를 표시합니다
                // 마커를 중심으로 커스텀 오버레이를 표시하기위해 CSS를 이용해 위치를 설정했습니다
                var customOverlay = new daum.maps.CustomOverlay({
                    content: content,
                    map: map,
                    position: marker.getPosition()
                });
                customOverlay.setVisible(true);
                // 오버레이 안에 닫기버튼 누를시 오버레이 사라진다. 
                $(".custom_overlay_close").on('click', function () {
                    customOverlay.setMap(null);
                    daum.maps.event.addListener(marker, 'mouseover', hover);
                });
                // 오버레이 클릭시 detail.html 이동
                $(".custom_overlay_wrap .body").on('click', function () {
                    var query = '?';
                    for (var key in place) {
                        query = query + key + '=' + place[key] + '&';
                    }
                    location.href = "detail.html" + query;
                });

            });

            itemEl.onclick = function () {
                var query = '?';
                for (var key in place) {
                    query = query + key + '=' + place[key] + '&';
                }
                location.href = "detail.html" + query;
            };
            itemEl.onmouseover = function () {
                displayInfowindow(marker, place.place_name);
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
    var el = document.createElement("li"),
        itemStr =
            '<span class="markerbg marker_' +
            (index + 1) +
            '"></span>' +
            '<div class="info">' +
            "<h5>" +
            places.place_name +
            "</h5>";

    if (places.road_address_name) {
        itemStr +=
            "<span>" +
            places.road_address_name +
            "</span>" +
            '<span class="jibun gray">' +
            places.address_name +
            "</span>";
    } else {
        itemStr += "<span>" + places.address_name + "</span>";
    }

    itemStr += '<span class="tel">' + places.phone + "</span>" + "</div>";
    el.innerHTML = itemStr;
    el.className = "item";

    return el;
}

// 마커를 생성하고 지도 위에 마커를 표시하는 함수입니다
function addMarker(position, idx, title) {
    var imageSrc =
        "http://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_number_blue.png", // 마커 이미지 url, 스프라이트 이미지를 씁니다
        imageSize = new daum.maps.Size(36, 37), // 마커 이미지의 크기
        imgOptions = {
            spriteSize: new daum.maps.Size(36, 691), // 스프라이트 이미지의 크기
            spriteOrigin: new daum.maps.Point(0, idx * 46 + 10), // 스프라이트 이미지 중 사용할 영역의 좌상단 좌표
            offset: new daum.maps.Point(13, 37) // 마커 좌표에 일치시킬 이미지 내에서의 좌표
        },
        markerImage = new daum.maps.MarkerImage(
            imageSrc,
            imageSize,
            imgOptions
        ),
        marker = new daum.maps.Marker({
            position: position, // 마커의 위치
            image: markerImage
        });

    marker.setMap(map); // 지도 위에 마커를 표출합니다
    markers.push(marker); // 배열에 생성된 마커를 추가합니다

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
    var paginationEl = document.getElementById("pagination"),
        fragment = document.createDocumentFragment(),
        i;

    // 기존에 추가된 페이지번호를 삭제합니다
    while (paginationEl.hasChildNodes()) {
        paginationEl.removeChild(paginationEl.lastChild);
    }

    for (i = 1; i <= pagination.last; i++) {
        var el = document.createElement("a");
        el.href = "#";
        el.innerHTML = i;

        if (i === pagination.current) {
            el.className = "on";
        } else {
            el.onclick = (function (i) {
                return function () {
                    pagination.gotoPage(i);
                };
            })(i);
        }

        fragment.appendChild(el);
    }
    paginationEl.appendChild(fragment);
}

// 검색결과 목록 또는 마커를 클릭했을 때 호출되는 함수입니다
// 인포윈도우에 장소명을 표시합니다
function displayInfowindow(marker, title) {
    var content = '<div class="infowindow">' + title + '</div>';

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
var element_wrap = document.getElementById("wrap");

function foldDaumPostcode() {
    // iframe을 넣은 element를 안보이게 한다.
    element_wrap.style.display = "none";
}

function sample3_execDaumPostcode() {
    // 현재 scroll 위치를 저장해놓는다.
    var currentScroll = Math.max(
        document.body.scrollTop,
        document.documentElement.scrollTop
    );
    new daum.Postcode({
        oncomplete: function (data) {
            var addr = data.sido + " " + data.sigungu + " " + data.bname; // 주소 변수
            console.log(addr);
            $(".form_location").val(addr);
            $(".address_tracking").hide();
        },
        // 우편번호 찾기 화면 크기가 조정되었을때 실행할 코드를 작성하는 부분. iframe을 넣은 element의 높이값을 조정한다.
        onresize: function (size) {
            element_wrap.style.height = size.height + "px";
        },
        width: "340px",
        height: "800px"
    }).embed(element_wrap);

    // iframe을 넣은 element를 보이게 한다.
    element_wrap.style.display = "block";
}

$(function () {

    /**
     * ctrl누를때 줌 확대 축소기능과 텍스트 화면에 나오는 로직
     * */
    $(document).keydown(function (e) {
        // ctrl 누를때 확대 축소기능 열기
        if (e.keyCode == 17) {
            map.setZoomable(true);
        }
    });
    // ctrl키를 땔때
    $(document).keyup(function (e) {
        map.setZoomable(false);
    });

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

    // 다음 api 보여주기
    $(".form_location").click(function () {
        sample3_execDaumPostcode();
        $(".address_tracking").show();
    });

    // 현재 위치에 위도, 경도를 가져오는 로직
    navigator.geolocation.getCurrentPosition(function (position) {
        console.log(position.coords.latitude, position.coords.longitude);
        my_location_find(position.coords.latitude, position.coords.longitude);
    });
});

// 주소 검색창을 닫는 버튼및 기능
$(".cancel_address_tracking").click(function () {
    $(".address_tracking").hide();
});
