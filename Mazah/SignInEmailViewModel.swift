//
//  SignInEmailViewModel.swift
//  Mazah
//
//  Created by Noga Gercsak on 6/1/24.
//

import Foundation

@MainActor
final class SignInEmailViewModel: ObservableObject{
    
    @Published var email = ""
    @Published var password = ""
    
    func signUp() async throws{
        guard !email.isEmpty, !password.isEmpty else{
            print("No email or password found.")
            return
        }
        
        let authDataResult = try await AuthenticationManager.shared.createUser(email: email, password: password)
        let user = DBUser(userId: authDataResult.uid, email: authDataResult.email, dateCreated: Date())
        try await UserManager.shared.createNewUser(user: user)
    }
    
    
    func signIn() async throws{
        guard !email.isEmpty, !password.isEmpty else{
            print("No email or password found.")
            return
        }
        try await AuthenticationManager.shared.signInUser(email: email, password: password)
    }

}
