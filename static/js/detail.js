function saveMember() {
  var query = window.location.search.substr(1);
  if (query != "") {
    var data = {};
    var local_data = localStorage.getItem(storage_key);
    if (local_data != null) {
      data = JSON.parse(local_data);
    }

    var get_url_data = query.split("&");
    var member_index = Object.keys(data).length;
    data[member_index] = {};
    for (var i in get_url_data) {
      var split_data = get_url_data[i].split("=");
      var name = split_data[0];
      var value = decodeURIComponent(split_data[1]);
      if (name == "input_addr") {
        value = value.replace(/\+/gi, ' ');
      }
      data[member_index][name] = value;
    }
    var data_str = JSON.stringify(data);
    localStorage.setItem(storage_key, data_str);

    loadMember();
  }
}

$(function () {
  var query = window.location.search.substr(1);
  var get_url_data = query.split("&");
  for (var i in get_url_data) {
    if (get_url_data[i] !== "") {
      var split_data = get_url_data[i].split("=");
      var name = split_data[0];
      var value = decodeURIComponent(split_data[1]);
      if (name == 'id') {
        $("#storemap").attr("href", "http://map.daum.net/link/map/" + value);
        $("#route").attr("href", "http://map.daum.net/link/to/" + value);
        $("#roadmap").attr("href", "http://map.daum.net/link/roadview/" + value);
      } else {
        $("#" + name).text(value);
      }
    }
  }
});

