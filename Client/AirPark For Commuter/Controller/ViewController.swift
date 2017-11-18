//
// AirPark
// Team AirPark
// Sithhisack, Kim; Roy, Sayudh; Mansour, Moaz; Conroy, Nate; Dalke, Christopher
// Copyright © 2017 Team AirPark. All rights reserved.
//

import UIKit
import MapKit
import CoreLocation

class ViewController: UIViewController, UISearchBarDelegate, CLLocationManagerDelegate, UISearchDisplayDelegate{
    
    // Side-menu Leading Constraint
    @IBOutlet weak var leadingConstraint: NSLayoutConstraint!
    
    //Menu View
    @IBOutlet weak var menuView: UIView!
    
    //Search Bar
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
        let locations = [
            ["title": "Wegmans Hall", "subtitle": "$2/hr", "latitude": 43.126099, "longitude": -77.629326],
            ["title": "Morey Hall", "subtitle": "$2/hr", "latitude": 43.128394, "longitude": -77.629344],
            ["title": "Susan B. Anthony", "subtitle": "$2/hr",  "latitude": 43.129838, "longitude": -77.626315]
        ]
        
        for location in locations {
            let annotation = MKPointAnnotation()
            annotation.title = location["title"] as? String
            annotation.subtitle = location["subtitle"] as? String
            annotation.coordinate = CLLocationCoordinate2D(latitude: location["latitude"] as! Double, longitude: location["longitude"] as! Double)
            map.addAnnotation(annotation)
        }
        
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
    
    //Search Bar Home Screen Code Start
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
    //Search Bar Home Screen Code End
}
