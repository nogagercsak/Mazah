//
//  ViewControllerRecipe.swift
//  mazah_api_2
//
//  Created by Riya Zingade on 8/27/24.
//


import UIKit
class ViewControllerRecipe: UIViewController {
  @IBOutlet weak var tableView: UITableView!
  @IBOutlet weak var searchBar: UISearchBar!
  var recipes: [Recipe] = []
    override func viewDidLoad() {
        super.viewDidLoad()
        tableView.dataSource = self
        tableView.delegate = self
        searchBar.delegate = self
        
        tableView.isUserInteractionEnabled = true
        
        let tapGesture = UITapGestureRecognizer(target: self, action: #selector(handleTap))
        tableView.addGestureRecognizer(tapGesture)
        
        fetchRecipes() // Fetch initial set of recipes
    }
    
    @objc func handleTap() {
        print("Table view tapped")
    }

  func fetchRecipes() {
    // Example of fetching random recipes on initial load
    NetworkManager.shared.fetchRecipesByIngredients(ingredients: "apples,flour,sugar") { (result: Result<[Recipe], Error>) in
      switch result {
      case .success(let recipes):
        DispatchQueue.main.async {
          self.recipes = recipes
          self.tableView.reloadData()
        }
      case .failure(let error):
        print(error.localizedDescription)
      }
    }
  }
}
// MARK: - UITableViewDataSource, UITableViewDelegate
extension ViewControllerRecipe: UITableViewDataSource{
  func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
    return recipes.count
  }
  func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
    let cell = tableView.dequeueReusableCell(withIdentifier: "RecipeCell", for: indexPath)
    let recipe = recipes[indexPath.row]
    cell.textLabel?.text = recipe.title
    return cell
  }
}
// MARK: - UISearchBarDelegate
extension ViewControllerRecipe: UISearchBarDelegate {
  func searchBarSearchButtonClicked(_ searchBar: UISearchBar) {
    guard let searchText = searchBar.text, !searchText.isEmpty else {
      return
    }
    // Use the method for fetching recipes by ingredients
    NetworkManager.shared.fetchRecipesByIngredients(ingredients: searchText) { (result: Result<[Recipe], Error>) in
      switch result {
      case .success(let recipes):
        DispatchQueue.main.async {
          self.recipes = recipes
          self.tableView.reloadData()
        }
      case .failure(let error):
        print("Error searching recipes: \(error.localizedDescription)")
      }
    }
  }
}

// MARK: - UITableViewDelegate
extension ViewControllerRecipe: UITableViewDelegate {
  func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
    // Get the selected recipe
    print("Row selected at indexPath: \(indexPath)")
    let selectedRecipe = recipes[indexPath.row]
    
    // Here, you can present a new view controller or perform a segue
    // For simplicity, I'll just print the title of the selected recipe
    print("Selected recipe: \(selectedRecipe.title)")
    
    // Deselect the cell after tap
    tableView.deselectRow(at: indexPath, animated: true)
  }
}

