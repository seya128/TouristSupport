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
        var resasSpotsApiUrl = 'https://opendata.resas-portal.go.jp/api/v1/tourism/attractions';
        var rgeoApiUrl = "https://www.finds.jp/ws/rgeocode.php";
	var apiKey = "M1o2g9y0ORtM4StEcRPMBxiBwFr6lTPrZa9cXyJh"; 
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

            $.ajax({
		type: 'GET',
		url: resasSpotsApiUrl,
		headers: { 'X-API-KEY': apiKey },
		data: {cityCode: "-", prefCode: prefCode},
		dataType: 'json',
		success: function(ret){
		    //console.log(JSON.stringify(ret));
		    var sorted = ret.result.data.sort(function(a, b) {
			var distA = calcDistance(a, pos);
			var distB = calcDistance(b, pos);
			if (distA < distB) return -1;
			if (distA > distB) return 1;
			return 0;
		    });
		    //console.log(JSON.stringify(sorted));
		    sorted.forEach(function(spot) {
			var marker = new google.maps.Marker({
			    position: spot,
			    map: map,
			    title: spot.resourceName,
			    icon: {
				fillColor: "#FFBBBB",  //塗り潰し色
				fillOpacity: 0.8,  //塗り潰し透過率
				path: google.maps.SymbolPath.CIRCLE, //円を指定
				scale: 5,  //円のサイズ
				strokeColor: "#FF0000",  //枠の色
				strokeWeight: 1.0  //枠の透過率
			    },
			    
			});
			marker.addListener("click", function (argument) {
			    
			    var point = {
				latLng: new google.maps.LatLng(this.position.lat(), this.position.lng()),
				title: this.title
			    };
			    app.placeMarker(point, map);
			}.bind(marker));

		    });
		    // FIXME!!
		    
		    
		}
	    });
	    //defer.resolve();

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


function calcDistance(spot, pos) {
    var x = (spot.lat - pos.lat()) / 0.000008983148616;
    var y = (spot.lng - pos.lng()) / 0.000010966382364;
    //var x = spot.lat - pos.lat();
    //var y = spot.lng - pos.lng();
    var dist = Math.sqrt(x * x + y * y);
    /*
    if (spot.resourceName.indexOf("名古屋") >= 0) {
	console.log("MapPosition lat: "+pos.lat()+", lng: "+pos.lng());
	console.log(spot.resourceName+" lat: "+spot.lat+", lng: "+spot.lng);
	console.log(spot.resourceName+" dist: "+dist);
    }
    */
    return dist;
}


