//
//  Recipe.swift .swift
//  Mazah
//
//  Created by Ishika Meel on 7/13/24.
//

import Foundation
struct RecipeResponse: Codable {
    let results: [Recipe]
}
import Foundation
struct Recipe: Codable, Identifiable {
    let id: Int // Assuming your API provides a unique identifier for each recipe
    let title: String
    // Other properties as needed
}
