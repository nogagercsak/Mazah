//
//  TrackerViewModel.swift
//  Mazah
//
//  Created by Noga Gercsak on 6/26/24.
//

import Foundation
import FirebaseFirestore
import FirebaseFirestoreSwift

struct Food: Codable, Identifiable {
    @DocumentID var id: String?
    var name: String
    var creationDate: Date
    var expDate: Date
    var foodType: String
    var reminder: Bool
    
    init(id: String? = nil, name: String, creationDate: Date, expDate: Date, foodType: String, reminder: Bool, category: String) {
        self.id = id
        self.name = name
        self.creationDate = creationDate
        self.expDate = expDate
        self.foodType = foodType
        self.reminder = reminder
    }
}
