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
    var userId: String? = Auth.auth().currentUser?.uid

    var body: some View {
        HStack(spacing: 0) {
            // Profile Button
            NavigationLink(destination: ProfileView(showSignInView: $showSignInView)) {
                Image(systemName: "person.crop.circle")
                    .font(.system(size: 24))
                    .foregroundColor(.gray)
                    .padding()
            }
            .buttonStyle(PlainButtonStyle())

            // Scanner Button
            NavigationLink(destination: ScannerView(showSignInView: $showSignInView)) {
                Image(systemName: "barcode.viewfinder")
                    .font(.system(size: 24))
                    .foregroundColor(.gray)
                    .padding()
            }
            .buttonStyle(PlainButtonStyle())

            // Food History Button
            if let userId = userId {
                NavigationLink(destination: FoodHistoryView(userId: userId, showSignInView: $showSignInView)) {
                    Image(systemName: "clock.arrow.circlepath")
                        .font(.system(size: 24))
                        .foregroundColor(.gray)
                        .padding()
                }
                .buttonStyle(PlainButtonStyle())
            } else {
                Text("")
                    .padding()
            }

            // Settings Button
            NavigationLink(destination: SettingsView(showSignInView: $showSignInView)) {
                Image(systemName: "gearshape")
                    .font(.system(size: 24))
                    .foregroundColor(.gray)
                    .padding()
            }
            .buttonStyle(PlainButtonStyle())
        }
        .frame(height: 60)
        .background(Color.white)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 5)
    }
}

struct NavBar_Previews: PreviewProvider {
    static var previews: some View {
        NavBar(showSignInView: .constant(true))
    }
}
