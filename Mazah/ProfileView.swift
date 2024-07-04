//
//  ProfileView.swift
//  Mazah
//
//  Created by Noga Gercsak on 6/1/24.
//

import SwiftUI

@MainActor
final class ProfileViewModel: ObservableObject{
    
    @Published private(set) var user: DBUser? = nil
        
    func loadCurrentUser() async throws{
        let authDataResult = try AuthenticationManager.shared.getAuthenticatedUser()
        self.user = try await UserManager.shared.getUser(userId: authDataResult.uid)
    }
}

import SwiftUI

struct ProfileView: View {
    
    @StateObject private var viewModel = ProfileViewModel()
    @Binding var showSignInView: Bool
    
    
    var body: some View {
        VStack{
            List{
                if let user = viewModel.user{
                    Text("UserId: \(user.userId)")
                    
                    if let email = user.email{
                        Text("Email: \(email.description)")
                    }
                }
            }
            .task{
                try? await viewModel.loadCurrentUser()
            }
            .navigationTitle("Profile")
                        
            Spacer()
            
            NavBar(showSignInView: $showSignInView)
        }
    }
}

struct ProfileView_Previews: PreviewProvider {
    static var previews: some View {
        RootView()
    }
}
