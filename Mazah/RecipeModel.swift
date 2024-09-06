import Foundation
struct RecipeResponse: Codable {
    let results: [Recipe]
}
import Foundation
struct Recipe: Codable, Identifiable {
    let id: Int
    let title: String
}
