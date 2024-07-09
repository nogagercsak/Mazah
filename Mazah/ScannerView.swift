//
//  ScannerView.swift
//  Mazah
//
//  Created by Noga Gercsak on 6/26/24.
//
import SwiftUI

struct ScannerView: View {
    
    @Binding var showSignInView: Bool
    @Environment(\.presentationMode) var presentationMode: Binding<PresentationMode>
    
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
                            Text("Add Food Manually +")
                                .padding()
                                .frame(width: 214, height: 60)
                                .background(Color(red: 0.62, green: 0.76, blue: 0.62))
                                .foregroundColor(.white)
                                .cornerRadius(10)
                                .padding()
                                .font(Font.custom("Poppins-Regular", size: 18))
                        }
                    }
                }
            }
            .navigationBarItems(leading: Button(action: {
                            self.presentationMode.wrappedValue.dismiss()
                        }) {
                            HStack {
                                Image(systemName: "chevron.left")
                                    .foregroundColor(Color(red: 0.45, green: 0.68, blue: 0));
                                Text("Go back to Foods")
                                    .underline()
                                    .foregroundColor(Color(red: 0.45, green: 0.68, blue: 0));
                            }
                        })
        }
    }
}

struct ScannerView_Previews: PreviewProvider {
    @State static var showSignInView = false
    
    static var previews: some View {
        ScannerView(showSignInView: $showSignInView)
    }
}
