//
//  MazahApp.swift
//  Mazah
//
//  Created by Noga Gercsak on 5/21/24.
//

import SwiftUI
import Firebase


@main
struct MazahApp: App {
    init() {
        FirebaseApp.configure()
    }
    
    var body: some Scene {
        WindowGroup {
            RootView()
        }
    }
}
