#pragma once
#include <fstream>
#include <string>

// Структура для сохранения одного предмета (без текстуры)
struct SavedItem {
    std::string name;
    int type;           // ItemType как int
    float damage;
    int attackType;     // Item::AttackType как int
    bool isEmpty;       // true если слот пустой

    SavedItem() : type(-1), damage(0.f), attackType(0), isEmpty(true) {}
};

struct GameSaveData {
    // Герой
    int heroCurrentHP = 100;
    int heroMaxHP = 100;
    int heroLevel = 1;
    int heroCurrentXP = 0;
    int heroXPToNextLevel = 100;

    // Позиция героя
    float heroPosX = 512.f;
    float heroPosY = 512.f;

    // Инвентарь (расширенная версия)
    int equippedWeapon = 0;       // 0 = нет, 1 = есть
    int equippedWeaponType = 0;   // 0 = лук, 1 = посох мага
    int equippedArmor = 0;        // 0 = нет, 1 = есть
    int equippedArmorType = 0;    // 0 = броня, 1 = мантия мага 
    int equippedAccessory = 0;    // 0 = нет, 1 = есть

    // Текущая локация
    int currentLocationID = 0;

    // === СТАТИСТИКА ===
    float totalPlayTime = 0.f;
    int slimesKilled = 0;
    int bossesKilled = 0;

    // === РЮКЗАК (6 слотов) ===
    SavedItem backpack[6];  // Инициализируется конструктором SavedItem
};

class SaveSystem {
public:
    static bool saveGame(const GameSaveData& data, const std::string& filename = "save.dat") {
        std::ofstream file(filename); // Текстовый режим
        if (!file.is_open()) {
            std::cout << "Error: Could not save game!" << std::endl;
            return false;
        }

        // Сохраняем простые поля
        file << data.heroCurrentHP << "\n";
        file << data.heroMaxHP << "\n";
        file << data.heroLevel << "\n";
        file << data.heroCurrentXP << "\n";
        file << data.heroXPToNextLevel << "\n";
        file << data.heroPosX << "\n";
        file << data.heroPosY << "\n";
        file << data.equippedWeapon << "\n";
        file << data.equippedWeaponType << "\n";
        file << data.equippedArmor << "\n";
        file << data.equippedArmorType << "\n";
        file << data.equippedAccessory << "\n";
        file << data.currentLocationID << "\n";
        file << data.totalPlayTime << "\n";
        file << data.slimesKilled << "\n";
        file << data.bossesKilled << "\n";

        // Сохраняем рюкзак
        for (int i = 0; i < 6; ++i) {
            file << data.backpack[i].isEmpty << "\n";
            if (!data.backpack[i].isEmpty) {
                file << data.backpack[i].name << "\n";
                file << data.backpack[i].type << "\n";
                file << data.backpack[i].damage << "\n";
                file << data.backpack[i].attackType << "\n";
            }
        }

        file.close();
        std::cout << "Game saved successfully!" << std::endl;
        return true;
    }

    static bool loadGame(GameSaveData& data, const std::string& filename = "save.dat") {
        std::ifstream file(filename);
        if (!file.is_open()) {
            std::cout << "No save file found. Starting new game." << std::endl;
            return false;
        }

        // Загружаем простые поля
        file >> data.heroCurrentHP;
        file >> data.heroMaxHP;
        file >> data.heroLevel;
        file >> data.heroCurrentXP;
        file >> data.heroXPToNextLevel;
        file >> data.heroPosX;
        file >> data.heroPosY;
        file >> data.equippedWeapon;
        file >> data.equippedWeaponType;
        file >> data.equippedArmor;
        file >> data.equippedArmorType;
        file >> data.equippedAccessory;
        file >> data.currentLocationID;
        file >> data.totalPlayTime;
        file >> data.slimesKilled;
        file >> data.bossesKilled;

        // Загружаем рюкзак
        for (int i = 0; i < 6; ++i) {
            file >> data.backpack[i].isEmpty;
            if (!data.backpack[i].isEmpty) {
                file >> data.backpack[i].name;
                file >> data.backpack[i].type;
                file >> data.backpack[i].damage;
                file >> data.backpack[i].attackType;
            }
        }

        file.close();
        std::cout << "Game loaded successfully!" << std::endl;
        return true;
    }

    static bool doesSaveExist(const std::string& filename = "save.dat") {
        std::ifstream file(filename);
        return file.good();
    }
};
