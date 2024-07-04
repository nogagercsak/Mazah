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
    var scanDate: Date
    var expirationDate: Date
    var keyWords: [String: String]
    var remindMe: Bool
    var foodType: String
    var imageUrl: String
    var category: String
    
    init(id: String? = nil, name: String, scanDate: Date, expirationDate: Date, keyWords: [String: String], foodType: String, remindMe: Bool, category: String, imageUrl: String) {
        self.id = id
        self.name = name
        self.scanDate = scanDate
        self.expirationDate = expirationDate
        self.keyWords = keyWords
        self.foodType = foodType
        self.remindMe = remindMe
        self.category = category
        self.imageUrl = imageUrl
    }
}
