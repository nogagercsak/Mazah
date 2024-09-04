//
//  Recipe.swift
//  mazah_api_2
//
//  Created by Riya Zingade on 8/27/24.
//

import Foundation
struct RecipeResponse: Codable {
  let results: [Recipe]
}
import Foundation
struct Recipe: Codable, Identifiable {
  let id: Int
  let title: String
}
