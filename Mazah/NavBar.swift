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
        HStack(spacing: 20) {
            Spacer()
            
            NavigationLink(destination: ProfileView(showSignInView: $showSignInView)
                            .navigationBarBackButtonHidden(true)) {
                Image(systemName: "person.crop.circle")
                    .font(.title)
            }
            .navigationBarBackButtonHidden(true)
            .padding(.leading, 20)
            .transaction { transaction in
                transaction.animation = nil
            }
            
            Spacer()
            
            NavigationLink(destination: ScannerView(showSignInView: $showSignInView)) {
                Image(systemName: "barcode.viewfinder")
                    .font(.title)
            }
            .padding(.leading, 20)
            
            Spacer()
            
            NavigationLink(destination: SettingsView(showSignInView: $showSignInView)
                            .navigationBarBackButtonHidden(true)) {
                Image(systemName: "gearshape")
                    .font(.title)
            }
            .padding(.trailing, 5)
            
            if let userId = userId {
                NavigationLink(destination: FoodHistoryView(userId: userId, showSignInView: $showSignInView)) {
                    Image(systemName: "clock.arrow.circlepath")
                        .font(.title)
                }
                .padding(.trailing, 20)
            } else {
                Text("User not authenticated")
                    .foregroundColor(.red)
                    .padding(.trailing, 20)
            }
        }
        .foregroundColor(.primary)
        .padding(.top, 20)
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
