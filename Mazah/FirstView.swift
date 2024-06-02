//
//  FirstView.swift
//  Mazah
//
//  Created by Noga Gercsak on 6/1/24.
//


import SwiftUI

struct FirstView: View {
    @State private var isFirstLaunch: Bool = true // State to track if it's the first launch
    
    var body: some View {
        Group {
            if isFirstLaunch {
                // Show the FirstView if it's the first launch
                NavigationView {
                    VStack {
                        Text("Mazah")
                            .font(.custom("andale-mono", size: 95))
                            .multilineTextAlignment(.center)
                            .foregroundColor(Color(red: 0.34, green: 0.41, blue: 0.34))
                            .fontWeight(.bold)
                            .frame(width: 400, height: 76, alignment: .top)
                            .offset(x: 0, y: -40)
        
                        
                        Text("Start your food saving journey today.")
                            .font(.custom("SeoulHangang B", size: 22))
                            .multilineTextAlignment(.center)
                            .foregroundColor(Color(red: 0.34, green: 0.41, blue: 0.34))
                            .frame(width: 237, height: 52, alignment: .center)
                            .offset(x: 0, y: -20)
                        
                        NavigationLink(destination: RootView()) {
                            ZStack {
                                Rectangle()
                                    .foregroundColor(.clear)
                                    .frame(width: 350, height: 50)
                                    .background(Color(red: 0.43, green: 0.51, blue: 0.42))
                                    .cornerRadius(30)
                                
                                Text("Start")
                                    .font(.custom("SeoulHangang B", size: 25))
                                    .multilineTextAlignment(.center)
                                    .foregroundColor(Color(red: 0.98, green: 0.93, blue: 0.66))
                                    .frame(width: 100, height: 35, alignment: .center)
                            }
                            .offset(x: 0, y: 15)
                        }
                        
                    }
                    .frame(width: 393, height: 852)
                    .background(Image("Gradient")
                        .resizable()
                        .aspectRatio(contentMode: .fill))
                }
                .onAppear {
                    UserDefaults.standard.set(false, forKey: "isFirstLaunch") // Set isFirstLaunch to false after first launch
                }
            } else {
                // Show something else if it's not the first launch
                RootView()
            }
        }
        .onAppear {
            self.isFirstLaunch = UserDefaults.standard.bool(forKey: "isFirstLaunch")
        }
    }
}

struct FirstView_Previews: PreviewProvider {
    static var previews: some View {
        FirstView()
    }
}
