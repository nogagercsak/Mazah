//
//  SpoonacularService.swift
//  mazah_api_2
//
//  Created by Riya Zingade on 8/27/24.
//

import Foundation
func fetchRecipes(completion: @escaping ([Recipe]?, Error?) -> Void) {
  guard let url = URL(string: "https://api.spoonacular.com/recipes/random?apiKey=c93621833cee468989d069edd8bc9145") else {
    completion(nil, NSError(domain: "Invalid URL", code: 0, userInfo: nil))
    return
  }
  var request = URLRequest(url: url)
  request.httpMethod = "GET"
  URLSession.shared.dataTask(with: request) { data, response, error in
    if let error = error {
      completion(nil, error)
      return
    }
    guard let data = data else {
      completion(nil, NSError(domain: "No data", code: 0, userInfo: nil))
      return
    }
    do {
      let decoder = JSONDecoder()
      let recipesResponse = try decoder.decode(RecipesResponse.self, from: data)
      completion(recipesResponse.recipes, nil)
    } catch {
      completion(nil, error)
    }
  }.resume()
}
struct RecipesResponse: Codable {
  let recipes: [Recipe]
}
