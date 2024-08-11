//
//  RootView.swift
//  Mazah
//
//  Created by Noga Gercsak on 6/1/24.
//

import SwiftUI

struct RootView: View {
    
    @State private var showSignInView: Bool = false
    
    var body: some View {
        ZStack{
            Image("Gradient")
            .resizable()
            .scaledToFill()
            .edgesIgnoringSafeArea(.all)
            
            NavigationStack{
                ProfileView(showSignInView: $showSignInView)
            }
            
        }
        .onAppear{
            let authUser = try?  AuthenticationManager.shared.getAuthenticatedUser()
            self.showSignInView = authUser == nil
        }
        .fullScreenCover(isPresented: $showSignInView){
            NavigationStack {
                AuthenticationView(showSignInView: $showSignInView)
            }
        }
    }
}

#Preview {
    RootView()
}
