//
//  SignUpEmailView.swift
//  Mazah
//
//  Created by Noga Gercsak on 6/1/24.
//

import SwiftUI


struct SignUpEmailView: View {
    
    @StateObject private var viewModel = SignInEmailViewModel()
    @Binding var showSignInView: Bool
    
    var body: some View {
        VStack{
            TextField("Email...", text: $viewModel.email)
                .padding()
                .background(Color.gray.opacity(0.3))
                .cornerRadius(10)
            
            SecureField("Password...", text: $viewModel.password)
                .padding()
                .background(Color.gray.opacity(0.3))
                .cornerRadius(10)
            
            Button{
                Task{
                    do{
                        try await viewModel.signUp()
                        showSignInView =  false
                        return
                    } catch {
                        print(error)
                    }
                    
                    do{
                        try await viewModel.signIn()
                        showSignInView =  false
                        return
                    } catch {
                        print(error)
                    }
                }
            } label: {
                Text("Sign Up")
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(height: 55)
                    .frame(maxWidth: .infinity)
                    .background(Color.blue)
                    .cornerRadius(10)
            }
            Spacer()
        }
        .padding()
        .navigationTitle("Sign Up With Email")
    }
}

struct SignUpWithEmail: PreviewProvider{
    static var previews: some View{
        NavigationStack{
            SignUpEmailView(showSignInView: .constant(false))
        }
    }
}
