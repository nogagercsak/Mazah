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
  @State private var selectedRecipe: Recipe?
  @State private var showRecipeDetail = false
  var body: some View {
      

      VStack {
          SearchBar(text: $searchText, onSearchButtonClicked: fetchRecipes)
              .padding()
          
          List(recipes) { recipe in
              Button(action: {
                  selectedRecipe = recipe
                  showRecipeDetail = true
              }) {
                  Text(recipe.title)
                      .font(Font.custom("Poppins-Regular", size: 24))
                      .padding()
                      .background(Color(red: 0.43, green: 0.51, blue: 0.42))
                      .cornerRadius(8)
              }
          }
      }
    .onAppear {
      fetchRecipes()
    }
      
    .sheet(isPresented: $showRecipeDetail) {
                if let recipe = selectedRecipe {
                    RecipeDetailView(recipeId: recipe.id)
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
      TextField(" Search ingredients...", text: $text, onCommit: {
        onSearchButtonClicked()
      })
      .font(Font.custom("Poppins-Regular", size: 18))
      .textFieldStyle(RoundedBorderTextFieldStyle())
      .padding(5)
      .cornerRadius(20)
      Button(action: {
        onSearchButtonClicked()
      }) {
        Text("Search")
              .font(Font.custom("Poppins-Regular", size: 18))
              .padding(10)
              .foregroundColor(.white)
              .background(Color(red: 0.43, green: 0.51, blue: 0.42))
              .cornerRadius(10)
      }
    }
    .padding(.leading, 10)
  }
}


#Preview {
  RecipeView()
}
