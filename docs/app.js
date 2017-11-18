var map, initPos;
var app = {
    markers: [],

    // MAP初期化
    initMap: function () {
        // 初期マーカー位置（JR大阪駅）
        initPos = new google.maps.LatLng(34.702485, 135.495951);

        // マップ生成
        map = new google.maps.Map(document.getElementById('map'), {
            center: initPos,
            zoom: 14,
            // mapTypeId: 'roadmap'
        });

        // クリックイベントリスナ
        map.addListener('click', function mylistener(event) {
            console.log(event);
            var latLng = new google.maps.LatLng(event.latLng.lat(), event.latLng.lng());
            this.placeMarker(latLng, map);
        }.bind(this));
    },

    // マーカー追加
    placeMarker: function (latLng, map) {
        var marker = new google.maps.Marker({
            animation: google.maps.Animation.DROP,
            label: "" + (this.markers.length + 1),
            position: latLng,
            map: map
        });
        this.markers.push(marker);

        // if(app.markers.length >= 2) {
        //     app.markers[app.markers.length-2].setLabel("A");
        // }
    }


};






new Vue({
    el: '#app',
    data: function () {
        return app;
    },
    methods : {
        getRouteUrl: function(latLng1,latLng2) {
            var s = "https://www.google.co.jp/maps/dir/";
            s += latLng1.lat() + "," + latLng1.lng() +"/";
            s += latLng2.lat() + "," + latLng2.lng();
            console.log(s);
            return s;            
        }
    }
});
