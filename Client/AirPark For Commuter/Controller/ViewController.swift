//
//  ViewController.swift
//  AirPark For Commuter
//
//  Created by Sitthisack, Kim on 11/14/17.
//  Copyright © 2017 Sitthisack, Kim. All rights reserved.
//

import UIKit

class ViewController: UIViewController{
    
    @IBOutlet weak var leadingConstraint: NSLayoutConstraint!
    
    var menuShowing = false
    
    override func viewDidLoad() {
        super.viewDidLoad()
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
    
}
