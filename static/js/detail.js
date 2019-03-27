/**
 * 사용하는 로컬 스토리지 "matzip" json 데이터 형태
 * {
 *      0: {
 *          address_name: [지번 주소]
            category_group_code: [카테고리 그룹 코드](사용안함)
            category_group_name: [카테고리 그룹 이름]
            category_name: [카테고리 이름]
            distance: [거리](사용안함)
            id: [아이디]
            phone: [전화번호]
            place_name: [플레이스 이름]
            place_url: [플레이스 링크]
            reviews: {
                grade: [평가 등급](good, soso, bad),
                disadvantages: [단점],
                advantages: [장점]
            }
            road_address_name: [도로명 주소]
            x: [위도]
            y: [경도]
 *      }
 * }
 */

var storage_key = "matzip"; // 로컬 스토리지에 저장할 키
var place_data = {}; // 현재 플레이스 데이터를 저장할 객체

/**
 * url에 있는 쿼리 값을 가져와서 각 요소에 넣어주는 로직
 ***/
function query_load() {
    var query = window.location.search.substr(1); // url에 있는 쿼리값을 가져온다.
    if (query != "") {
        var get_url_data = query.split("&"); // '&' 기준으로 나누어 배열로 저장
        var id = "";
        for (var i in get_url_data) { // 나눈값들을 하나 씩 돌리며 진행
            if (get_url_data[i] !== "") { // 값이 있을 때만 실행
                var split_data = get_url_data[i].split("="); // 값을 '=' 기준으로 나누어서 배열에 저장
                var name = split_data[0]; // key를 'name' 변수에 저장
                var value = decodeURIComponent(split_data[1]); // 값을 decode해서 'value' 변수에 저장
                place_data[name] = value;
                if (name == 'id') { // key가 'id' 일때만 실행
                    $("#storemap").attr("href", "http://map.daum.net/link/map/" + value); // 지도로 가는 링크를 만들어 줌
                    $("#route").attr("href", "http://map.daum.net/link/to/" + value); // 길찾기로 가는 링크를 만들어 줌
                    $("#roadmap").attr("href", "http://map.daum.net/link/roadview/" + value); // 로드맵으로 가는 링크를 만들어 줌
                    id = value;
                } else if (name == "reviews") { // key가 'reviews' 일 때만 실행
                    storage_load(id);
                } else { // key가 'id'가 아니라면
                    $("#" + name).text(value); // 각 key가 id인 요소에 값들을 넣어줌
                }
            }
        }
    } else {
        alert("잘못된 접근입니다!");
        history.back();
    }
}

/**
 * 해당 Id에 대한 리뷰가 작성된것이 local storage에 있을 때 데이터를 가져와서 각 요소에 넣어주는 로직
 ***/
function storage_load(id) {
    var local_data = localStorage.getItem(storage_key); // 로컬 스토리지에 있는 "matzip" 키에 대한 데이터을 가져온다.
    if (local_data != null) { // 로컬 스토리지에 있는 "matzip" 키에 대한 데이터가 있으면 실행
        local_data = JSON.parse(local_data); // string 데이터를 json으로 변경
        for (var i in local_data) { // 변경된 json 데이터를 돌려주며 로직 실행
            if (local_data[i]["id"] == id) { // url query id와 동일 한 것을 만나면
                $('#grade_' + local_data[i]["reviews"]["grade"]).prop("checked", true); // grade 값에 따라 버튼 밑에 radio를 체크(good, soso, bad)
                $('#grade_' + local_data[i]["reviews"]["grade"]).parent().addClass("active"); // grade 값에 따라 버튼 활성화(good, soso, bad)
                $('#disadvantages').val(local_data[i]["reviews"]["disadvantages"]); // 단점 필드에 값 입력
                $('#advantages').val(local_data[i]["reviews"]["advantages"]); // 장점 필드에 값 입력
                $(".review_submit_wrap > button").text("수정"); // 등록 버튼을 수정 버튼으로 이름 변경
            }
        }
    }
}

$(function () {

    query_load();

    // 등록(수정)버튼을 누르면 실행
    $("#review_form").submit(function(e) {
        e.preventDefault(); // 기존 이벤트를 막는다.

        var data = {}; //data를 담을 빈 객체 생성
        var local_data = localStorage.getItem(storage_key); // 로컬 스토리지에 있는 "matzip" 키에 대한 데이터을 가져온다.
        if (local_data != null) { // 로컬 스토리지에 있는 "matzip" 키에 대한 데이터가 있으면 실행
            data = JSON.parse(local_data); // string으로 되어있는 데이터를 json으로 바꿔서 data 변수에 넣어줌(data가 있으면 그 뒤에 넣기 위한 로직)
        }
        
        if (!place_data.hasOwnProperty("reviews")) { // 위에 정의한 지금 현재 플레이스에 대한 json 데이터에 "reviews" 키가 없으면
            place_data["reviews"] = {}; // "reviews" 키를 만들고 객채로 생성
        }
        place_data["reviews"] = { // "reviews" 객체에 아래 값 추가
            "grade": $('input[name="grade"]:checked').val(),
            "disadvantages": $('#disadvantages').val(),
            "advantages": $('#advantages').val()
        };

        var isId = false; // 아이디가 동일한지 확인하는 변수
        var index; // data가 있을때 동일한 아이디가 있는 index가 몇 번째 인지 넣는 변수
        for (var i in data) { // 가져온 데이터를 돌려주며
            if (data[i]["id"] == place_data["id"]) { // id가 같으면 아래 값으로 변경
                isId = true;
                index = i;
            }
        }

        if (isId) { // 로컬 스토리지에 있는 "matzip" 키에 대한 데이터에 현재 플레이스 데이터가 있으면
            data[index] = place_data; // 리뷰를 추가한 현재 새로운 데이터로 덮어 쓴다.
        } else { // 없다면
            data[Object.keys(data).length] = place_data; // 새로운 데이터를 data 안에 추가
        }

        var data_str = JSON.stringify(data); // 조합한 json data를 string으로 변경해서 변수에 넣음
        localStorage.setItem(storage_key, data_str); // 그 변수를 로컬 스토리지에 있는 "matzip" 키에 대한 데이터로 저장 

        $(".review_submit_wrap > button").text("수정"); // 수정이 되었으니 등록 버튼을 수정 버튼으로 이름 변경
    });

});

