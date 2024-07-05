//
//  ScannerView.swift
//  Mazah
//
//  Created by Noga Gercsak on 6/26/24.
//
import SwiftUI

struct ScannerView: View {
    
    @Binding var showSignInView: Bool
    
    var body: some View {
        NavigationView {
            ZStack {
                BarcodeCaptureViewControllerRepresentable()
                    .edgesIgnoringSafeArea(.all)
                
                VStack {
                    Spacer()
                    HStack {
                        Spacer()
                        NavigationLink(destination: AddFoodManualView()) {
                            Text("Add Food Manually")
                                .padding()
                                .background(Color.blue)
                                .foregroundColor(.white)
                                .cornerRadius(8)
                                .padding()
                        }
                    }
                }
            }
            .navigationBarHidden(true)
        }
    }
}
