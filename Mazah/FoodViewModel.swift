//
//  FoodViewModel.swift
//  Mazah
//
//  Created by Gabrielle on 22.07.2024.
//

import Foundation
import Combine
class FoodViewModel: ObservableObject {
    @Published var expirationDate = Date()
    @Published var showConfirmation = false
    
    var name = ""
    var imageUrl = ""
    var scanDate = Date()
    
    func addFood(forUser userId: String, category: String) {
        print("Added food for user \(userId) with category \(category)")
        showConfirmation = true
    }
}

