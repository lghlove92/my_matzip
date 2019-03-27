

$(function () {

    /**
     * url에 있는 쿼리 값을 가져와서 각 요소에 넣어주는 로직
     ***/
    var query = window.location.search.substr(1); // url에 있는 쿼리값을 가져온다.
    var get_url_data = query.split("&"); // '&' 기준으로 나누어 배열로 저장
    for (var i in get_url_data) { // 나눈값들을 하나 씩 돌리며 진행
        if (get_url_data[i] !== "") { // 값이 있을 때만 실행
            var split_data = get_url_data[i].split("="); // 값을 '=' 기준으로 나누어서 배열에 저장
            var name = split_data[0]; // key를 'name' 변수에 저장
            var value = decodeURIComponent(split_data[1]); // 값을 decode해서 'value' 변수에 저장
            if (name == 'id') { // key가 'id' 일때만 실행
                $("#storemap").attr("href", "http://map.daum.net/link/map/" + value); // 지도로 가는 링크를 만들어 줌
                $("#route").attr("href", "http://map.daum.net/link/to/" + value); // 길찾기로 가는 링크를 만들어 줌
                $("#roadmap").attr("href", "http://map.daum.net/link/roadview/" + value); // 로드맵으로 가는 링크를 만들어 줌
            } else { // key가 'id'가 아니라면
                $("#" + name).text(value); // 각 key가 id인 요소에 값들을 넣어줌
            }
        }
    }

});

