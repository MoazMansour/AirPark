//
//  Person.swift
//  AirPark For Commuter
//
//  Created by Sitthisack, Kim on 11/13/17.
//  Copyright © 2017 Sitthisack, Kim. All rights reserved.
//

// Navigation Tutorial: https://www.youtube.com/watch?v=INfCmCxLC0o

import Foundation

class Person{
    
    private var _name = "Name";
    private var _lastName = "Last Name";
    
    var name: String {
        get{
            return _name;
        }
        set{
            _name = newValue;
        }
    }
    
    var lastName: String{
        get{
            return _lastName;
        }
        set{
            _lastName = newValue;
        }
    }
    
    func getWholeName() -> String {
        return "\(name) \(lastName)";
    }
}
