//
//  ViewControllerRecipe.swift
//  Mazah
//
//  Created by Ishika Meel on 7/13/24.
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
        searchBar.delegate = self // Connect search bar delegate
        fetchRecipes() // Fetch initial set of recipes
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
extension ViewControllerRecipe: UITableViewDataSource, UITableViewDelegate {
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
