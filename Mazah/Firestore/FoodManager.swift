//
//  FoodManager.swift
//  Mazah
//
//  Created by Noga Gercsak on 6/26/24.
//

import Foundation
import Combine
import FirebaseFirestore
import FirebaseFirestoreSwift

class FoodViewModel: ObservableObject {
    @Published var name: String = ""
    @Published var scanDate = Date()
    @Published var expirationDate: Date = Date()
    @Published var keyWords: [String: [String]] = [:]
    @Published var remindMe = false
    @Published var foodType: String = ""
    @Published var imageUrl: String = ""
    @Published var showConfirmation: Bool = false
    
    private var db = Firestore.firestore()
    private var cancellables = Set<AnyCancellable>()
    
    func saveFoodInfo(userId: String) {
        let foodData: [String: Any] = [
            "name": name,
            "scanDate": scanDate,
            "expirationDate": expirationDate,
            "keyWords": keyWords,
            "remindMe": remindMe,
            "foodType": foodType,
            "imageUrl": imageUrl
        ]
        
        db.collection("users").document(userId).collection("foods").addDocument(data: foodData) { error in
            if let error = error {
                print("Error adding document: \(error)")
            } else {
                print("Document added successfully")
                DispatchQueue.main.async {
                    self.showConfirmation = true
                }
            }
        }
    }
}

enum FirestoreError: Error {
    case documentCreationError
}
class FirestoreManager {
    static let shared = FirestoreManager() 
    private let db = Firestore.firestore()
    
    func addFood(forUser userId: String, _ food: Food, completion: @escaping (Result<Food, Error>) -> Void) {
        do {
            // Encode the entire food object
            let encodedFood = try Firestore.Encoder().encode(food)
            
            let foodData = encodedFood as [String: Any]
            
            _ = db.collection("users").document(userId).collection("foods").addDocument(data: foodData) { error in
                if let error = error {
                    completion(.failure(error))
                } else {
                    completion(.success(food))
                }
            }
        } catch {
            completion(.failure(FirestoreError.documentCreationError))
        }
    }
    
    func deleteFood(forUser userId: String, foodId: String, completion: @escaping (Error?) -> Void) {
        db.collection("users").document(userId).collection("foods").document(foodId).delete { error in
            if let error = error {
                completion(error)
            } else {
                completion(nil)
            }
        }
    }
}
