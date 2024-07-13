//
//  Network.Manager.swift
//  Mazah
//
//  Created by Ishika Meel on 7/13/24.
//

import Foundation
class NetworkManager {
    static let shared = NetworkManager()
    private init() {}
    let baseURL = "https://api.spoonacular.com/recipes"
    let apiKey = "c93621833cee468989d069edd8bc9145"
    // Fetch recipes by ingredients
    func fetchRecipesByIngredients(ingredients: String, completion: @escaping (Result<[Recipe], Error>) -> Void) {
        let endpoint = "\(baseURL)/findByIngredients"
        var components = URLComponents(string: endpoint)!
        components.queryItems = [
            URLQueryItem(name: "apiKey", value: apiKey),
            URLQueryItem(name: "ingredients", value: ingredients)
        ]
        guard let url = components.url else {
            completion(.failure(NSError(domain: "Invalid URL", code: 0, userInfo: nil)))
            return
        }
        let task = URLSession.shared.dataTask(with: url) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            guard let data = data else {
                completion(.failure(NSError(domain: "No data", code: 0, userInfo: nil)))
                return
            }
            do {
                let decoder = JSONDecoder()
                let recipes = try decoder.decode([Recipe].self, from: data)
                completion(.success(recipes))
            } catch {
                completion(.failure(error))
            }
        }
        task.resume()
    }
}
