package com.datapeice.slbackend.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class AnticheatPayloadRequest {

    private String player;
    private String uuid;
    private AnticheatData data;

    @Data
    public static class AnticheatData {
        private String launcherName;
        private String launcherBrand;
        private String processes;
        private List<String> mods;
        private List<String> resourcepacks;
    }
}
