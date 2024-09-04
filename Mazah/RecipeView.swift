//
//  RecipeView.swift
//  mazah_api_2
//
//  Created by Riya Zingade on 8/27/24.
//

import SwiftUI
struct RecipeView: View {
    
  @State private var recipes: [Recipe] = []
  @State private var searchText: String = ""
  @State private var selectedRecipe: Recipe? // State to track the selected recipe
  @State private var showRecipeDetail = false // State to control showing the detail view
  var body: some View {
      

      VStack {
          SearchBar(text: $searchText, onSearchButtonClicked: fetchRecipes)
          List(recipes) { recipe in
              Button(action: {
                  selectedRecipe = recipe
                  showRecipeDetail = true
              }) {
                  Text(recipe.title)
              }
          }
      }
    .onAppear {
      fetchRecipes()
    }
      
    .sheet(isPresented: $showRecipeDetail) {
                if let recipe = selectedRecipe {
                    RecipeDetailView(recipeId: recipe.id) // Pass the selected recipe to the detail view
                }
            }
  }
  func fetchRecipes() {
    NetworkManager.shared.fetchRecipesByIngredients(ingredients: searchText) { recipesResult in
      switch recipesResult {
      case .success(let recipes):
        DispatchQueue.main.async {
        print("Fetched recipes: \(recipes)")
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
      }
    }
    .padding()
  }
}





#Preview {
  RecipeView()
}
