//
//  ViewController.swift
//  AirPark For Commuter
//
//  Created by Sitthisack, Kim on 11/14/17.
//  Copyright © 2017 Sitthisack, Kim. All rights reserved.
//

import UIKit
import MapKit
import CoreLocation

class ViewController: UIViewController, UISearchBarDelegate, CLLocationManagerDelegate, UISearchDisplayDelegate{
    
    // Side-menu Leading Constraint
    @IBOutlet weak var leadingConstraint: NSLayoutConstraint!
    @IBOutlet weak var menuView: UIView!
    @IBOutlet weak var SearchBarMap: UISearchBar!
    
    //Map Code Starts
    @IBOutlet weak var map: MKMapView!
    let manager = CLLocationManager()
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        let location = locations[0]
        let span:MKCoordinateSpan = MKCoordinateSpanMake(0.01, 0.01)
        let myLocation:CLLocationCoordinate2D = CLLocationCoordinate2DMake(location.coordinate.latitude, location.coordinate.longitude)
        let region:MKCoordinateRegion = MKCoordinateRegionMake(myLocation, span)
        map.setRegion(region, animated: true)
        self.map.showsUserLocation = true
        
        //Map Other Locations Start
        // Rettner Hall: 43.128527, -77.629867
        // Wegmans Hall: 43.126099, -77.629326
        let spotLocation:CLLocationCoordinate2D = CLLocationCoordinate2DMake(43.128527, -77.629867)
        
        let annotation = MKPointAnnotation()
        
        annotation.coordinate = spotLocation
        annotation.title = "Sayudh Roy"
        annotation.subtitle = "$2/hr"
        map.addAnnotation(annotation)
        
        //Map Other Locations End
        
    }
    //Map Code Ends
    
    

    //Sliding Menu Code Start

    var menuShowing = false
    override func viewDidLoad() {
        super.viewDidLoad()
        // Shadow for the side-menu
        menuView.layer.shadowOpacity = 2
        SearchBarMap.delegate = self
        manager.delegate=self
        manager.desiredAccuracy=kCLLocationAccuracyBest
        manager.requestWhenInUseAuthorization()
        manager.startUpdatingLocation()
    }
        
    func searchBarSearchButtonClicked(_ searchBar: UISearchBar) {
            SearchBarMap.resignFirstResponder()
            let geocoder = CLGeocoder()
            geocoder.geocodeAddressString(SearchBarMap.text!) {(placemarks:[CLPlacemark]?, error:Error?) in
                if error == nil {
                    
                    let placemark = placemarks?.first
                    let anno = MKPointAnnotation()
                    anno.coordinate = (placemark?.location?.coordinate)!
                    anno.title = self.SearchBarMap.text!
                    let span = MKCoordinateSpanMake(0.075, 0.075)
                    let region = MKCoordinateRegion(center: anno.coordinate, span: span)
                    self.map.setRegion(region, animated: true)
                    self.map.addAnnotation(anno)
                    self.map.selectAnnotation(anno, animated: true)

                } else {
                    print(error?.localizedDescription ?? "error")
                }
            }
    }
    
     @IBAction func openMenu(_ sender: Any) {
        if(menuShowing){
            leadingConstraint.constant = -140
        } else{
            leadingConstraint.constant = 0
            
            UIView.animate(withDuration: 0.3, animations: {
                self.view.layoutIfNeeded()
                })
        }
        menuShowing = !menuShowing
    }
    //Sliding Menu Code End
    }


