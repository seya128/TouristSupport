var map, initPos;
var app = {
    markers: [],

    // MAP初期化
    initMap: function () {
        // 初期マーカー位置
        initPos = new google.maps.LatLng(35.1681151,136.8764946);
        // RESAS APIから観光スポット取得
        var spots = this.getSpots(initPos);

        // マップ生成
        map = new google.maps.Map(document.getElementById('map'), {
            center: initPos,
            zoom: 12,
            // mapTypeId: 'roadmap'
        });
        // place service
        this.placeService = new google.maps.places.PlacesService(map);

        // サーチボックス
        var input = document.getElementById('pac-input');
        var searchBox = new google.maps.places.SearchBox(input);
        map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
        map.addListener('bounds_changed', function () {
            searchBox.setBounds(map.getBounds());
        });
        var s_markers = [];
        // Listen for the event fired when the user selects a prediction and retrieve
        // more details for that place.
        searchBox.addListener('places_changed', function () {
            console.log("places_changed");

            var places = searchBox.getPlaces();
            console.log(places);

            if (places.length == 0) {
                return;
            }

            // Clear out the old markers.
            s_markers.forEach(function (marker) {
                marker.setMap(null);
            });
            s_markers = [];

            // For each place, get the icon, name and location.
            var bounds = new google.maps.LatLngBounds();
            places.forEach(function (place) {
                if (!place.geometry) {
                    console.log("Returned place contains no geometry");
                    return;
                }
                var icon = {
                    url: place.icon,
                    size: new google.maps.Size(71, 71),
                    origin: new google.maps.Point(0, 0),
                    anchor: new google.maps.Point(17, 34),
                    scaledSize: new google.maps.Size(25, 25)
                };

                // Create a marker for each place.
                var marker = new google.maps.Marker({
                    map: map,
                    icon: icon,
                    title: place.name,
                    position: place.geometry.location
                });
                marker.addListener("click", function (argument) {
                    console.log(this);
                    var point = {
                        latLng: new google.maps.LatLng(this.position.lat(), this.position.lng()),
                        title: this.title,
                    }
                    app.placeMarker(point, map);
                }.bind(marker));
                s_markers.push(marker);

                if (place.geometry.viewport) {
                    // Only geocodes have viewport.
                    bounds.union(place.geometry.viewport);
                } else {
                    bounds.extend(place.geometry.location);
                }
            });
            map.fitBounds(bounds);
        });


        // クリックイベントリスナ
        map.addListener('click', function mylistener(event) {
            console.log(event);
            var point = {
                latLng: new google.maps.LatLng(event.latLng.lat(), event.latLng.lng()),
            }
            if (event.placeId)
                point.placeId = event.placeId;

            this.placeMarker(point, map);
        }.bind(this));
    },

    // マーカー追加
    placeMarker: function (point, map) {

        var marker = new google.maps.Marker({
            animation: google.maps.Animation.DROP,
            label: "" + (this.markers.length + 1),
            position: point.latLng,
            map: map
        });
        if (point.title) {
            // タイトルがあればそれをセット
            marker.setTitle(point.title);
            this.markers.push(marker);
        } else if (point.placeId) {
            console.log(marker);
            // place idがあれば、詳細検索して名前をセット
            request = {
                placeId: point.placeId,
            };
            this.placeService.getDetails(request, function callback(place, status) {
                console.log(this);
                if (status == google.maps.places.PlacesServiceStatus.OK) {
                    this.setTitle(place.name);
                }
                app.markers.push(marker);
            }.bind(marker));
        } else {
            this.markers.push(marker);
        }
    },

    // RESAS APIから観光スポット取得
    getSpots: function (pos) {
        var resasSpotsUrl = 'https://opendata.resas-portal.go.jp/api/v1/tourism/attractions';
        var rgeoApiUrl = "https://www.finds.jp/ws/rgeocode.php";
        var apiKey = ""; // RESASのAPI Key
        $.ajax({
            type: 'GET',
            url: rgeoApiUrl,
            //headers: { 'X-API-KEY': apiKey },
            data: {lat: pos.lat(), lon: pos.lng(), json: "1"},
            dataType: 'json',
            success: function(ret){
            //console.log(JSON.stringify(ret));
            var prefCode = ret.result.prefecture.pcode;
            var cityCode = ret.result.municipality.mcode;
            console.log("prefCode: "+prefCode);
            console.log("cityCode: "+cityCode);
            
            
            // FIXME!!
            
            
            //deferred.resolve();
            }
        });
        }
    

};






new Vue({
    el: '#app',
    data: function () {
        return app;
    },
    methods: {
        getRouteUrl: function (latLng1, latLng2) {
            var s = "https://www.google.co.jp/maps/dir/";
            s += latLng1.lat() + "," + latLng1.lng() + "/";
            s += latLng2.lat() + "," + latLng2.lng();
            console.log(s);
            return s;
        },
        getName: function (marker) {
            var name = "";
            if (marker.title)
                name = marker.title;
            else
                name = marker.position.lat() + "," + marker.position.lng();

            return name;
        }
    }
});
