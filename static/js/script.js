var storage_key = "matzip"; // 로컬 스토리지에 저장할 키
var local_places = {};

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
 */
function my_location_find() {
    navigator.geolocation.getCurrentPosition(function (position) {
        var latlng = new daum.maps.LatLng(position.coords.latitude, position.coords.longitude);
        searchAddrFromCoords(latlng, function (result, status) {
            if (status === daum.maps.services.Status.OK) {
                map.setCenter(new daum.maps.LatLng(position.coords.latitude, position.coords.longitude)); // 현재 위치로 지도 이동
                map.setLevel(3);
                $(".form_location").val(result[0].address_name); // 읍,면,동까지의 주소를 주소 input에 넣음
                $("#keyword").focus();
            }
        });
    });
}

/**
 * 처음에 내가 리뷰를 등록한 마크가 뜨는 로직
 ***/
function storage_load() {
    var local_data = localStorage.getItem(storage_key); // 로컬 스토리지에 있는 "matzip" 키에 대한 데이터을 가져온다.
    if (local_data != null) { // 로컬 스토리지에 있는 "matzip" 키에 대한 데이터가 있으면 실행
        local_data = JSON.parse(local_data); // string 데이터를 json으로 변경
        local_places = local_data;
        displayPlaces(local_data);
    } else {
        my_location_find();
    }
}

// 평가된 마커를 생성하고 지도 위에 평가된 마커를 표시하는 함수입니다
function addLocalMarker(position, status) {
    var imageSrc = "static/img/" + status + ".png", // 상태에 따른 마커 이미지 url
        imageSize = new daum.maps.Size(58, 51), // 마커 이미지의 크기
        markerImage = new daum.maps.MarkerImage(
            imageSrc,
            imageSize
        ),
        marker = new daum.maps.Marker({
            position: position, // 마커의 위치
            image: markerImage
        });

    marker.setMap(map); // 지도 위에 마커를 표출합니다
    markers.push(marker); // 배열에 생성된 마커를 추가합니다

    return marker;
}

// 키워드 검색을 요청하는 함수
function searchPlaces() {
    var keyword = document.getElementById("keyword").value;
    var addrData = $(".form_location").val();
    if (!keyword.replace(/^\s+|\s+$/g, "")) {
        alert("키워드를 입력해주세요!");
        return false;
    }
    // 장소검색 객체를 통해 키워드로 장소검색을 요청 (검색 결과 값 넣어서 같이 검색)
    ps.keywordSearch(addrData + " " + keyword, placesSearchCB);
}

function query_load() {
    var query = window.location.search.substr(1); // url에 있는 쿼리값을 가져온다.
    if (query != "") {
        var addrData = "";
        var keyword = "";
        var get_url_data = query.split("&"); // '&' 기준으로 나누어 배열로 저장
        for (var i in get_url_data) { // 나눈값들을 하나 씩 돌리며 진행
            if (get_url_data[i] !== "") { // 값이 있을 때만 실행
                var split_data = get_url_data[i].split("="); // 값을 '=' 기준으로 나누어서 배열에 저장
                var name = split_data[0]; // key를 'name' 변수에 저장
                var value = decodeURIComponent(split_data[1]); // 값을 decode해서 'value' 변수에 저장
                if (name == "addr") {
                    $(".form_location").val(value);
                    addrData = value;
                    $.fn.fullpage.moveSectionDown();
                } else if (name == "food") {
                    $("#keyword").val(value);
                    keyword = value;
                }
            }
        }
        ps.keywordSearch(addrData + " " + keyword, placesSearchCB);
    }
}

// 장소검색이 완료됐을 때 호출되는 콜백함수 입니다
function placesSearchCB(data, status, pagination) {
    if (status === daum.maps.services.Status.OK) {
        // 정상적으로 검색이 완료됐으면
        // 검색 목록과 마커를 표출합니다
        if (Object.keys(local_places).length > 0) {
            for (var i in data) {
                for (var j in local_places) {
                    if (local_places[j]["id"] == data[i]["id"]) {
                        data[i]['reviews'] = local_places[j]['reviews'];
                    }
                }
            }
        }
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
        var placePosition = new daum.maps.LatLng(places[i].y, places[i].x);
        var marker;
        var itemEl;
        if (places[i].hasOwnProperty("reviews")) {
            marker = addLocalMarker(placePosition, places[i]['reviews']['grade']);
            itemEl = getListItem(places[i]['reviews']['grade'], places[i]);
        } else {
            marker = addMarker(placePosition, i);
            itemEl = getListItem(i, places[i]);
        }

        // 마커를 생성하고 지도에 표시합니다

        // 검색된 장소 위치를 기준으로 지도 범위를 재설정하기위해
        // LatLngBounds 객체에 좌표를 추가합니다
        bounds.extend(placePosition);

        // 마커와 검색결과 항목에 mouseover 했을때
        // 해당 장소에 인포윈도우에 장소명을 표시합니다
        // mouseout 했을 때는 인포윈도우를 닫습니다
        (function (marker, place) {
            var hover = function () {
                displayInfowindow(marker, place.place_name.split(" ")[0]);
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
                    '                <div class="ellipsis">' + place.road_address_name + '</div>' +
                    '                <div class="jibun ellipsis">' + place.address_name + '</div>' +
                    '                <div>' + place.phone + '</div>' +
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
                    var keyword = document.getElementById("keyword").value;
                    var addrData = $(".form_location").val();
                    var query = '?';
                    for (var key in place) {
                        query = query + key + '=' + place[key] + '&';
                    }
                    location.href = "detail.html" + query + "addr=" + addrData + "&food=" + keyword;
                });

            });

            itemEl.onclick = function () {
                var keyword = document.getElementById("keyword").value;
                var addrData = $(".form_location").val();
                var query = '?';
                for (var key in place) {
                    query = query + key + '=' + place[key] + '&';
                }
                location.href = "detail.html" + query + "addr=" + addrData + "&food=" + keyword;
            };
            itemEl.onmouseover = function () {
                displayInfowindow(marker, place.place_name);
                map.setCenter(new daum.maps.LatLng(place.y, place.x));
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
            $(".form_location").val(addr);
            $(".address_tracking").hide();
            $("#keyword").focus();
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
    
    $('#fullpage').fullpage({
        //options here
        autoScrolling:true,
        scrollHorizontally: true,
        anchors: ['page1', 'page2'],
    });

    //methods
    $.fn.fullpage.setAllowScrolling(true);

    var referrer = document.referrer;
    var front_referrer = referrer.split(".html?");
    var before_page = front_referrer[0].split("/");
    if (before_page[before_page.length - 1] == "detail") {
        query_load();
    }

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
    $("#map").on("mousewheel DOMMouseScroll", function (e) {
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
        // 검색 결과 목록에 추가된 항목들을 제거합니다
        var listEl = document.getElementById("placesList");
        removeAllChildNods(listEl);
        // 지도에 표시되고 있는 마커를 제거합니다
        removeMarker();
    });

    // 주소 검색창을 닫는 버튼및 기능
    $(".cancel_address_tracking").click(function () {
        $(".address_tracking").hide();
    });

    $(".my_matzip_btn").click(function () {
        storage_load();
    });

    $(".navbar-brand").click(function () {
        my_location_find();
    });
});

// 글씨
// function([string1, string2],target id,[color1,color2])    
consoleText(['/  SAVE YOUR BEST <b>RESTAURANT<b>  /', 'Console Text', 'Made with Love.'], 'text', ['lightblue']);

function consoleText(words, id, colors) {
    if (colors === undefined) colors = ['#fff'];
    var visible = true;
    var con = document.getElementById('console');
    var letterCount = 1;
    var x = 1;
    var waiting = false;
    var target = document.getElementById(id)
    target.setAttribute('style', 'color:' + colors[0])
    window.setInterval(function () {

        if (letterCount === 0 && waiting === false) {
            waiting = true;
            target.innerHTML = words[0].substring(0, letterCount)
            window.setTimeout(function () {
                var usedColor = colors.shift();
                colors.push(usedColor);
                var usedWord = words.shift();
                words.push(usedWord);
                x = 1;
                target.setAttribute('style', 'color:' + colors[0])
                letterCount += x;
                waiting = false;
            }, 1000)
        } else if (letterCount === words[0].length + 1 && waiting === false) {
            waiting = true;
            window.setTimeout(function () {
                x = -1;
                letterCount += x;
                waiting = false;
            }, 1000)  //문장 체인지 속도
        } else if (waiting === false) {
            target.innerHTML = words[0].substring(0, letterCount)
            letterCount += x;
        }
    }, 120) //타이핑속도
    window.setInterval(function () {
        if (visible === true) {
            con.className = 'console-underscore hidden'
            visible = false;

        } else {
            con.className = 'console-underscore'

            visible = true;
        }
    }, 400)
}