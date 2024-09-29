//
//  NavBar.swift
//  Mazah
//
//  Created by Noga Gercsak on 6/1/24.
//

import SwiftUI
import FirebaseAuth

struct NavBar: View {
    @Binding var showSignInView: Bool
    @State private var selectedTab: Tab = .profile
    var userId: String? = Auth.auth().currentUser?.uid

    enum Tab {
        case profile, scanner, recipes, foodHistory, settings
    }

    var body: some View {
        HStack {
            // Profile Button
            NavBarButton(icon: "person.crop.circle", label: "Profile", isSelected: selectedTab == .profile) {
                selectedTab = .profile
                // Action to navigate to ProfileView
            }
            
            // Scanner Button
            NavBarButton(icon: "barcode.viewfinder", label: "Scanner", isSelected: selectedTab == .scanner) {
                selectedTab = .scanner
                // Action to navigate to ScannerView
            }
            
            // Recipes Button
            NavBarButton(icon: "sparkle.magnifyingglass", label: "Recipes", isSelected: selectedTab == .recipes) {
                selectedTab = .recipes
                // Action to navigate to RecipeView
            }

            // Food History Button
            if let userId = userId {
                NavBarButton(icon: "clock.arrow.circlepath", label: "History", isSelected: selectedTab == .foodHistory) {
                    selectedTab = .foodHistory
                    // Action to navigate to FoodHistoryView
                }
            }

            // Settings Button
            NavBarButton(icon: "gearshape", label: "Settings", isSelected: selectedTab == .settings) {
                selectedTab = .settings
                // Action to navigate to SettingsView
            }
        }
        .padding(.horizontal, 20)
        .frame(height: 80)
        .background(Color(.systemGray6))
        .cornerRadius(20)
        .shadow(color: Color.black.opacity(0.2), radius: 10, x: 0, y: 5)
        .padding(.horizontal)
    }
}

struct NavBarButton: View {
    var icon: String
    var label: String
    var isSelected: Bool
    var action: () -> Void

    var body: some View {
        VStack {
            Image(systemName: icon)
                .font(.system(size: isSelected ? 28 : 24))
                .foregroundColor(isSelected ? Color.blue : Color.gray)
            Text(label)
                .font(.caption)
                .foregroundColor(isSelected ? Color.blue : Color.gray)
        }
        .padding()
        .onTapGesture {
            action()
        }
        .frame(maxWidth: .infinity)
    }
}

struct NavBar_Previews: PreviewProvider {
    static var previews: some View {
        NavBar(showSignInView: .constant(true))
    }
}
