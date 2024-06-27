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


final class AddFoodViewModel: ObservableObject {
    @Published var foodName: String = ""
    @Published var creationDate = Date()
    @Published var expirationDate = Date()
    @Published var foodType: String = ""
    @Published var remindMe = false
    @Published var notesVar: String = ""
    
    private var cancellables = Set<AnyCancellable>()
    
    var addedFood = PassthroughSubject<Food, Never>()
    
    func addFood(forUser userId: String, category: String) {
        let newFood = Food(name: foodName, creationDate: creationDate, expDate: expirationDate, foodType: foodType, reminder: remindMe, category: category)  // Pass category
        FirestoreManager.shared.addFood(forUser: userId, newFood) { [weak self] result in
            switch result {
            case .success(let food):
                self?.addedFood.send(food)
            case .failure(let error):
                print("Error adding food item: \(error.localizedDescription)")
            }
        }
    }
}
enum FirestoreError: Error {
    case documentCreationError
}
class FirestoreManager {
    static let shared = FirestoreManager() // Singleton instance
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
