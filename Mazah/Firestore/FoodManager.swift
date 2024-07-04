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
    @Published var keyWords: [String: String] = [:]
    @Published var remindMe = false
    @Published var foodType: String = ""
    @Published var imageUrl: String = ""
    @Published var showConfirmation: Bool = false
    @Published var scannedFoods: [Food] = []  // For storing fetched foods

    private var db = Firestore.firestore()
    private var cancellables = Set<AnyCancellable>()
    
    var addedFood = PassthroughSubject<Food, Never>()
        
    func addFood(forUser userId: String, category: String) {
        let newFood = Food(name: name, scanDate: scanDate, expirationDate: expirationDate, keyWords: keyWords, foodType: foodType, remindMe: remindMe, category: category, imageUrl: imageUrl)
        FirestoreManager.shared.addFood(forUser: userId, newFood) { [weak self] result in
            switch result {
            case .success(let food):
                self?.addedFood.send(food)
                self?.showConfirmation = true
            case .failure(let error):
                print("Error adding food item: \(error.localizedDescription)")
                self?.showConfirmation = false
            }
        }
    }
    
    func fetchScannedFoods(forUser userId: String) {
        db.collection("users").document(userId).collection("foods").getDocuments { [weak self] snapshot, error in
            if let error = error {
                print("Error fetching scanned foods: \(error.localizedDescription)")
                return
            }
            
            if let snapshot = snapshot {
                self?.scannedFoods = snapshot.documents.compactMap { document in
                    try? document.data(as: Food.self)
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
