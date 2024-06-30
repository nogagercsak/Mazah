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
    var expirationDate: Date
    var keyWords: [String: String]
    var remindMe: Bool
    var foodType: String
    
    init(id: String? = nil, name: String, creationDate: Date, expirationDate: Date, keyWords:[String: String], foodType: String, remindMe: Bool, category: String) {
        self.id = id
        self.name = name
        self.creationDate = creationDate
        self.expirationDate = expirationDate
        self.keyWords = keyWords
        self.foodType = foodType
        self.remindMe = remindMe
    }
}
