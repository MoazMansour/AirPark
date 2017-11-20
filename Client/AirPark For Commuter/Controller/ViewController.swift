//
// AirPark
// Team AirPark
// Sithhisack, Kim; Roy, Sayudh; Mansour, Moaz; Conroy, Nate; Dalke, Christopher
// Copyright © 2017 Team AirPark. All rights reserved.
//

import UIKit
import MapKit
import CoreLocation

//This Class is for the SIGN IN PAGE
class ViewControllerSignIn: UIViewController, UITextFieldDelegate {
    
    //Sign In: Username Field
    @IBOutlet weak var username: UITextField!
    //Sign In: Password Field
    @IBOutlet weak var password: UITextField!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        self.username.delegate = self;
        self.password.delegate = self;
    }
    
    //Function to close the keyboard on pressing RETURN
    func textFieldShouldReturn(_ textField: UITextField) -> Bool {
        self.view.endEditing(true)
        return false
    }
}

//This Class is for the SIGN UP PAGE
class ViewControllerSignUp: UIViewController, UITextFieldDelegate {
   
    //Sign Up: Name Field
    @IBOutlet weak var Name: UITextField!
    //Sign Up: Username Field
    @IBOutlet weak var username: UITextField!
    //Sign Up: Password Field
    @IBOutlet weak var password: UITextField!
    //Sign Up: Retype Password Field
    @IBOutlet weak var retype: UITextField!
    //Sign Up: Email Field
    @IBOutlet weak var email: UITextField!
    //Sign Up: Phone Number Field
    @IBOutlet weak var phoneNo: UITextField!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        self.Name.delegate = self;
        self.username.delegate = self;
        self.password.delegate = self;
        self.retype.delegate = self;
        self.email.delegate = self;
        self.phoneNo.delegate = self;
    }
    
    //Function to close the keyboard on pressing RETURN
    func textFieldShouldReturn(_ textField: UITextField) -> Bool {
        self.view.endEditing(true)
        return false
    }
}

//This Class is for the HOST MODE PAGE
class ViewControllerHostMode: UIViewController, UIPickerViewDelegate, UIPickerViewDataSource{
    
    //Host Mode: Available From Field
    @IBOutlet weak var dateField: UITextField!
    //Host Mode: Available To Field
    @IBOutlet weak var dateField2: UITextField!
    //Host Mode: Number of Spots Field
    @IBOutlet weak var textNumSpots: UITextField!
    
    //UI Date Picker Object
    let picker = UIDatePicker()
    
    //Host-Mode: Available From Time Code Starts
    func createDatePicker(){
        let toolbar = UIToolbar()
        toolbar.sizeToFit()
        
        let done = UIBarButtonItem(barButtonSystemItem: .done, target: nil, action: #selector(donePressed))
        toolbar.setItems([done], animated: false)
        
        dateField.inputAccessoryView = toolbar
        dateField.inputView = picker
        
        picker.datePickerMode = .dateAndTime
    }
    
    @objc func donePressed() {
        
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        formatter.timeStyle = .medium
        
        let dateString = formatter.string(from: picker.date)
        
        dateField.text = "\(dateString)"
        self.view.endEditing(true)
    }
    //Host-Mode: Available From Time Code Ends
    
    //Host-Mode: Available To Time Code Starts
    func createDatePicker2(){
        let toolbar = UIToolbar()
        toolbar.sizeToFit()
        
        let done = UIBarButtonItem(barButtonSystemItem: .done, target: nil, action: #selector(donePressed2))
        toolbar.setItems([done], animated: false)
        
        dateField2.inputAccessoryView = toolbar
        dateField2.inputView = picker
        
        picker.datePickerMode = .dateAndTime
    }
    
    @objc func donePressed2() {
        
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        formatter.timeStyle = .medium
        
        let dateString = formatter.string(from: picker.date)
        
        dateField2.text = "\(dateString)"
        self.view.endEditing(true)
    }
    //Host-Mode: Available To Time Code Ends
    
    
    //Host-Mode: Number of Spots Code Starts
    let options = ["1", "2", "3", "4"]
    var pickerView = UIPickerView()
    
    public func numberOfComponents(in pickerView: UIPickerView) -> Int {
        return 1
    }
    
    public func pickerView(_ pickerView: UIPickerView, numberOfRowsInComponent component: Int) -> Int {
        return options.count
    }
    
    func pickerView(_ pickerView: UIPickerView, titleForRow row: Int, forComponent component: Int) -> String? {
        return options[row]
    }
    
    func pickerView(_ pickerView: UIPickerView, didSelectRow row: Int, inComponent component: Int) {
        textNumSpots.text = options[row]
        textNumSpots.resignFirstResponder()
    }
    
    //Host-Mode: Number of Spots Code Ends
    
    override func viewDidLoad() {
        super.viewDidLoad()
        createDatePicker()
        createDatePicker2()
        pickerView.delegate=self
        pickerView.dataSource=self
        textNumSpots.textAlignment = .center
        
        textNumSpots.inputView = pickerView
    }
    
}
// This Class is for the Main Page (with the MAP)
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
