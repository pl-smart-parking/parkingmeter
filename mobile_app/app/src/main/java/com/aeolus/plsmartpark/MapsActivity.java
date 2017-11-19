package com.aeolus.plsmartpark;

import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.IntentSender;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Point;
import android.location.Address;
import android.location.Geocoder;
import android.location.Location;
import android.net.Uri;
import android.os.Build;
import android.support.v4.app.ActivityCompat;
import android.support.v4.app.FragmentActivity;
import android.os.Bundle;


import java.io.*;
import java.net.*;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;
import com.google.android.gms.common.api.PendingResult;
import com.google.android.gms.common.api.Status;
import com.google.android.gms.location.LocationListener;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.LocationSettingsRequest;
import com.google.android.gms.location.LocationSettingsResult;
import com.google.android.gms.location.places.Place;
import com.google.android.gms.location.places.ui.PlaceAutocompleteFragment;
import com.google.android.gms.location.places.ui.PlaceSelectionListener;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.MapView;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.UiSettings;
import com.google.android.gms.maps.model.BitmapDescriptorFactory;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.Marker;
import com.google.android.gms.maps.model.MarkerOptions;
import com.google.android.gms.common.api.GoogleApiClient;


import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.Socket;
import java.net.URI;
import java.net.UnknownHostException;
import java.security.KeyStore;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.util.ArrayList;
import java.util.List;

import android.Manifest;
import android.support.v4.content.ContextCompat;
import android.support.v4.view.GravityCompat;
import android.support.v4.widget.DrawerLayout;
import android.support.v7.app.ActionBarDrawerToggle;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.Button;
import android.widget.Filter;
import android.widget.Filterable;
import android.widget.ImageButton;
import android.widget.ListView;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocketFactory;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

//main activity class
public class MapsActivity extends AppCompatActivity
        implements OnMapReadyCallback,
        GoogleApiClient.ConnectionCallbacks,
        GoogleApiClient.OnConnectionFailedListener,
        LocationListener {

    GoogleMap mGoogleMap;
    SupportMapFragment mapFrag;
    LocationRequest mLocationRequest;
    GoogleApiClient mGoogleApiClient;
    Location mLastLocation;
    Marker mCurrLocationMarker;
    DrawerLayout drawer;
    ImageButton indicatorButton;
    ImageButton buttonPay;
    ImageButton button_Contacts;
    ImageButton cycle;
    String rURL="http://ec2-52-203-22-58.compute-1.amazonaws.com:4343/api/all?type=<TYPE>&num=<NUM>&gps_lat=<CURR_LAT>&gps_long=<CURR_LONG>)";
    String recData;
    @Override //function called on app creation
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_maps);



        getSupportActionBar().hide(); //hide the obnoxious default toolbar
        //make the map refersh asyncronous
        mapFrag = (SupportMapFragment) getSupportFragmentManager().findFragmentById(R.id.map);
        mapFrag.getMapAsync(this);


        //style the sidebar indicator button
        indicatorButton = (ImageButton) findViewById(R.id.buttonIndicator);
        indicatorButton.setImageResource(R.drawable.ic_play_light);
        indicatorButton.bringToFront();

        buttonPay=(ImageButton) findViewById(R.id.buttonPay);

        buttonPay.bringToFront();

        button_Contacts=(ImageButton) findViewById(R.id.button_Contacts);

        button_Contacts.bringToFront();

        cycle=(ImageButton) findViewById(R.id.cycle);

        cycle.bringToFront();








        //style and solve some issues with the sidebar
        drawer = (DrawerLayout)findViewById(R.id.drawerLayout);
        drawer.setDrawerListener(new DrawerLayout.DrawerListener() {
            @Override
            public void onDrawerSlide(View drawerView, float slideOffset) {
                //if we want an on change method
            }
            @Override
            public void onDrawerOpened(View drawerView) {
                //if we want an on drawer opened method
            }
            @Override //when the drawer is closed, make sure it doesn't interfere with any of the other components
            public void onDrawerClosed(View drawerView) {
                findViewById(R.id.map).bringToFront();
                findViewById(R.id.place_autocomplete_fragment).bringToFront();
                indicatorButton.bringToFront();
                buttonPay.bringToFront();
                cycle.bringToFront();
                button_Contacts.bringToFront();

                drawer.invalidate();
            }
            @Override
            public void onDrawerStateChanged(int newState) {
                //another on state change method
            }
        });
        //tie pulling the drawer out to a button click rather than a swipe (won't work otherwise)
        indicatorButton.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                drawer.bringToFront();
                drawer.openDrawer(GravityCompat.START);
            }
        });
        buttonPay.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v){
                Intent pay_Intent= new Intent(Intent.ACTION_VIEW, Uri.parse("http://ec2-34-196-254-78.compute-1.amazonaws.com"));
                startActivity(pay_Intent);
                //ec2-52-203-22-58.compute-1.amazonaws.com:4343/Webpage.html

            }

        });
        //get the search bar
        PlaceAutocompleteFragment autocompleteFragment = (PlaceAutocompleteFragment)getFragmentManager().findFragmentById(R.id.place_autocomplete_fragment);
        //when the user finds a place to go, zoom there and place a marker to denote location. Make marker clickable.
        autocompleteFragment.setOnPlaceSelectedListener(new PlaceSelectionListener() {
            @Override
            public void onPlaceSelected(Place place) {
                LatLng placeLatLng = place.getLatLng();
                MarkerOptions plcMarkOpt = new MarkerOptions();
                plcMarkOpt.position(placeLatLng);
                plcMarkOpt.title((String) place.getName());
                plcMarkOpt.icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_CYAN));
                Marker mCurrLocationMarker = mGoogleMap.addMarker(plcMarkOpt);
                mGoogleMap.moveCamera(CameraUpdateFactory.newLatLngZoom(placeLatLng,14));
            }

            @Override
            public void onError(Status status) {
                // TODO: Handle the error.
            }
        });
    }
      //if the google api ever gets paused
    @Override
    public void onPause() {
        super.onPause();

        //stop location updates when Activity is no longer active
        if (mGoogleApiClient != null) {
            LocationServices.FusedLocationApi.removeLocationUpdates(mGoogleApiClient, this);
        }
    }
    //when the google map is ready, check permissions and bug the user if required
    @Override
    public void onMapReady(GoogleMap googleMap)
    {
        mGoogleMap=googleMap;
        mGoogleMap.setMapType(GoogleMap.MAP_TYPE_NORMAL); //sets the style of the map

        //Initialize Google Play Services
        if (android.os.Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (ContextCompat.checkSelfPermission(this,
                    Manifest.permission.ACCESS_FINE_LOCATION)
                    == PackageManager.PERMISSION_GRANTED) {
                //Location Permission already granted
                buildGoogleApiClient();
                mGoogleMap.setMyLocationEnabled(true);
            } else {
                //Request Location Permission
                checkLocationPermission();
            }
        }
        else {
            buildGoogleApiClient();
            mGoogleMap.setMyLocationEnabled(true);
        }
    }

    //this compiles the api client, connects to the actual maps api
    protected synchronized void buildGoogleApiClient() {
        mGoogleApiClient = new GoogleApiClient.Builder(this)
                .addConnectionCallbacks(this)
                .addOnConnectionFailedListener(this)
                .addApi(LocationServices.API)
                .build();
        mGoogleApiClient.connect();
    }
    //once the maps api is connected, make a location request to determine current location
    @Override
    public void onConnected(Bundle bundle) {
        mLocationRequest = new LocationRequest();
        mLocationRequest.setPriority(LocationRequest.PRIORITY_BALANCED_POWER_ACCURACY);
        if (ContextCompat.checkSelfPermission(this,
                Manifest.permission.ACCESS_FINE_LOCATION)
                == PackageManager.PERMISSION_GRANTED) {
            LocationServices.FusedLocationApi.requestLocationUpdates(mGoogleApiClient, mLocationRequest, this);
        }
    }

    public void recDataServer(String rURL, String recData){

        try {
            //recData = getHTML(rURL);
           JSONObject data ;
            Marker meter2= mGoogleMap.addMarker(new MarkerOptions().position(new LatLng(42.924041,-81.251486)).title("Meter1").snippet("Rate: $100000").icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_GREEN)));

            data = new JSONObject(getHTML(rURL));
            JSONArray data_array= data.getJSONArray("points");
            for(int i =0; i< data_array.length(); i++){
                JSONObject jsonObj=data_array.getJSONObject(i);
                String id = jsonObj.getString("_id");
                int current_vech = jsonObj.getInt("current_vehicles");
                int capacity_lot = jsonObj.getInt("capacity");
                int endTime = jsonObj.getInt("end_time");
                double lat_pos = jsonObj.getDouble("gps_lat");
                double  long_pos= jsonObj.getDouble("gps_long");
                int meter_num = jsonObj.getInt("number");
                int v =jsonObj.getInt("_v");
                double rate = jsonObj.getDouble("real_rate");

                if (meter_num<100){
                    buildMeter(lat_pos,long_pos,rate,meter_num,v);
                }
                else
                    buildLots(lat_pos, long_pos,rate,meter_num,capacity_lot);


            }

        } catch( Exception e ) { }
    }

    //if api connection is ever suspended
    @Override
    public void onConnectionSuspended(int i) {}
    //if api connection ever fails
    @Override
    public void onConnectionFailed(ConnectionResult connectionResult) {}
    //if the person changes location, refresh where the marker is
    @Override
    public void onLocationChanged(Location location)
    {
        mLastLocation = location;
        if (mCurrLocationMarker != null) {
            mCurrLocationMarker.remove();
        }

        //Place current location marker
        LatLng latLng = new LatLng(location.getLatitude(), location.getLongitude());
        MarkerOptions markerOptions = new MarkerOptions();
        markerOptions.position(latLng);
        //markerOptions.title("Current Position");
        markerOptions.icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_MAGENTA));
        Marker mCurrLocationMarker = mGoogleMap.addMarker(markerOptions);
        //move map camera
        mGoogleMap.moveCamera(CameraUpdateFactory.newLatLngZoom(latLng,14));

        indicatorButton.setImageResource(R.drawable.ic_media_route_disabled_mono_dark);
        recDataServer(rURL, recData);

    }

    public Marker buildMeter(double meter_lat, double meter_long, double meter_rate, int meter_id, int parkedIn){
        Marker meter2= mGoogleMap.addMarker(new MarkerOptions().position(new LatLng(42.024041,-81.251486)).title("Meter1").snippet("Rate: $100000").icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_GREEN)));

        if (parkedIn==1) {
            GoogleMap meterMap = mGoogleMap;
            Marker meter = mGoogleMap.addMarker(new MarkerOptions().position(new LatLng(meter_lat, meter_long)).title("Meter " + meter_id).snippet("Rate: " + meter_rate).icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_RED)));
            return (meter);
        }
        else {
            GoogleMap meterMap = mGoogleMap;
            Marker meter = mGoogleMap.addMarker(new MarkerOptions().position(new LatLng(meter_lat, meter_long)).title("Meter " + meter_id).snippet("Rate: " + meter_rate).icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_GREEN)));
            return (meter);
        }
    }
    public Marker buildLots(double meter_lat, double meter_long, double meter_rate, int meter_id, int capacity){
        Marker meter2= mGoogleMap.addMarker(new MarkerOptions().position(new LatLng(42.024041,-81.251486)).title("Meter1").snippet("Rate: $100000").icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_GREEN)));

        if (capacity>15) {
            Marker lot = mGoogleMap.addMarker(new MarkerOptions().position(new LatLng(meter_lat, meter_long)).title("Lot #" + meter_id).snippet("Rate: " + meter_rate).icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_RED)));
            return (lot);
        }
        else {
            GoogleMap meterMap = mGoogleMap;
            Marker lot = mGoogleMap.addMarker(new MarkerOptions().position(new LatLng(meter_lat, meter_long)).title("Lot # " + meter_id).snippet("Rate: " + meter_rate).icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_GREEN)));
            return (lot);
        }
    }

    //check whether we have the user's location permissions
    public static final int MY_PERMISSIONS_REQUEST_LOCATION = 99;
    private void checkLocationPermission() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
                != PackageManager.PERMISSION_GRANTED) {

            // Should we show an explanation?
            if (ActivityCompat.shouldShowRequestPermissionRationale(this,
                    Manifest.permission.ACCESS_FINE_LOCATION)) {

                // Show an explanation to the user *asynchronously* -- don't block
                // this thread waiting for the user's response! After the user
                // sees the explanation, try again to request the permission.
                new AlertDialog.Builder(this)
                        .setTitle("Location Permission Needed")
                        .setMessage("This app needs the Location permission, please accept to use location functionality")
                        .setPositiveButton("OK", new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialogInterface, int i) {
                                //Prompt the user once explanation has been shown
                                ActivityCompat.requestPermissions(MapsActivity.this,
                                        new String[]{Manifest.permission.ACCESS_FINE_LOCATION},
                                        MY_PERMISSIONS_REQUEST_LOCATION );
                            }
                        })
                        .create()
                        .show();


            } else {
                // No explanation needed, we can request the permission.
                ActivityCompat.requestPermissions(this,
                        new String[]{Manifest.permission.ACCESS_FINE_LOCATION},
                        MY_PERMISSIONS_REQUEST_LOCATION );
            }
        }
    }
    //either go ahead with initiating location services, or notify user they cannot use the app
    @Override
    public void onRequestPermissionsResult(int requestCode,
                                           String permissions[], int[] grantResults) {
        switch (requestCode) {
            case MY_PERMISSIONS_REQUEST_LOCATION: {
                // If request is cancelled, the result arrays are empty.
                if (grantResults.length > 0
                        && grantResults[0] == PackageManager.PERMISSION_GRANTED) {

                    // permission was granted, yay! Do the
                    // location-related task you need to do.
                    if (ContextCompat.checkSelfPermission(this,
                            Manifest.permission.ACCESS_FINE_LOCATION)
                            == PackageManager.PERMISSION_GRANTED) {

                        if (mGoogleApiClient == null) {
                            buildGoogleApiClient();
                        }
                        mGoogleMap.setMyLocationEnabled(true);
                    }

                } else {

                    // permission denied, boo! Disable the
                    // functionality that depends on this permission.
                    Toast.makeText(this, "permission denied", Toast.LENGTH_LONG).show();
                }
                return;
            }
        }
    }

    public static String getHTML(String rURL) throws Exception {
        StringBuilder result = new StringBuilder();
        URL url = new URL(rURL);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        BufferedReader rd = new BufferedReader(new InputStreamReader(conn.getInputStream()));
        String line;
        while ((line = rd.readLine()) != null) {
            result.append(line);
        }
        rd.close();
        return result.toString();
    }
}






