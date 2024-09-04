//
//  RecipeDetail.swift
//  mazah_api_2
//
//  Created by Riya Zingade on 9/3/24.
//

import Foundation
struct RecipeDetail: Codable {
    let id: Int
    let title: String
    let image: String?
    let summary: String?
    let extendedIngredients: [Ingredient]
    let instructions: String?
}

struct Ingredient: Codable {
    let original: String // The full ingredient description
}
