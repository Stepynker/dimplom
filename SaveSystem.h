#pragma once
#include <fstream>
#include <string>

struct GameSaveData {
    // Герой
    int heroCurrentHP;
    int heroMaxHP;
    int heroLevel;
    int heroCurrentXP;
    int heroXPToNextLevel;

    // Позиция героя
    float heroPosX;
    float heroPosY;

    // Инвентарь (простая версия - сохраняем только экипировку)
    int equippedWeapon;   // 0 = нет, 1 = лук, и т.д.
    int equippedArmor;    // 0 = нет, 1 = броня
    int equippedAccessory; // 0 = нет, 1 = кольцо

    // Текущая локация
    int currentLocationID;
};

class SaveSystem {
public:
    static bool saveGame(const GameSaveData& data, const std::string& filename = "save.dat") {
        std::ofstream file(filename, std::ios::binary);
        if (!file.is_open()) {
            std::cout << "Error: Could not save game!" << std::endl;
            return false;
        }

        file.write(reinterpret_cast<const char*>(&data), sizeof(GameSaveData));
        file.close();

        std::cout << "Game saved successfully!" << std::endl;
        return true;
    }

    static bool loadGame(GameSaveData& data, const std::string& filename = "save.dat") {
        std::ifstream file(filename, std::ios::binary);
        if (!file.is_open()) {
            std::cout << "No save file found. Starting new game." << std::endl;
            return false;
        }

        file.read(reinterpret_cast<char*>(&data), sizeof(GameSaveData));
        file.close();

        std::cout << "Game loaded successfully!" << std::endl;
        return true;
    }

    static bool doesSaveExist(const std::string& filename = "save.dat") {
        std::ifstream file(filename);
        return file.good();
    }
};
