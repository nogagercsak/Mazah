//
//  RecipeView.swift
//  Mazah
//
//  Created by Ishika Meel on 7/13/24.
//

import SwiftUI

struct RecipeView: View {
    @State private var recipes: [Recipe] = []
    @State private var searchText: String = ""
    var body: some View {
        VStack {
            SearchBar(text: $searchText, onSearchButtonClicked: fetchRecipes)
            List(recipes) { recipe in
                Text(recipe.title)
            }
        }
        .onAppear {
            fetchRecipes()
        }
    }
    func fetchRecipes() {
        NetworkManager.shared.fetchRecipesByIngredients(ingredients: searchText) { recipesResult in
            switch recipesResult {
            case .success(let recipes):
                DispatchQueue.main.async {
                    self.recipes = recipes
                }
            case .failure(let error):
                print("Error fetching recipes: \(error.localizedDescription)")
            }
        }
    }
}
struct RecipeView_Previews: PreviewProvider {
    static var previews: some View {
        RecipeView()
    }
}
struct SearchBar: View {
    @Binding var text: String
    var onSearchButtonClicked: () -> Void
    var body: some View {
        HStack {
            TextField("Search ingredients...", text: $text, onCommit: {
                onSearchButtonClicked()
            })
            .textFieldStyle(RoundedBorderTextFieldStyle())
            Button(action: {
                onSearchButtonClicked()
            }) {
                Text("Search")
                    .font(Font.custom("Poppins-Regular", size: 15))
                    .foregroundColor(Color(red: 0.40, green: 0.40, blue: 0.40))
            }
        }
        .padding()
    }
}
#Preview {
    RecipeView()
}
